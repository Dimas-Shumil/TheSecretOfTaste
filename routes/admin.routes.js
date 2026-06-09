const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { PrismaClient, Prisma } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const PRODUCT_UPLOADS_DIR = path.join(
  __dirname,
  '..',
  'site',
  'uploads',
  'products',
);

fs.mkdirSync(PRODUCT_UPLOADS_DIR, {
  recursive: true,
});

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      return callback(
        new Error('Разрешены только изображения JPG, PNG или WEBP'),
      );
    }

    return callback(null, true);
  },
});

function handleProductImageUpload(req, res, next) {
  productImageUpload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Фото слишком большое. Максимум 5 МБ',
      });
    }

    return res.status(400).json({
      message: error.message || 'Не удалось загрузить фото',
    });
  });
}

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Слишком много попыток входа. Попробуйте позже.',
  },
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({
    message: 'Требуется авторизация',
  });
}

function createCsrfToken(req) {
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  return token;
}

function validateCsrf(req, res, next) {
  const sessionToken = req.session && req.session.csrfToken;
  const requestToken = req.get('X-CSRF-Token');

  if (!sessionToken || !requestToken || sessionToken !== requestToken) {
    return res.status(403).json({
      message: 'Недействительный CSRF-токен',
    });
  }

  return next();
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeNullableString(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeNullableNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return null;
  }

  return number;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return fallback;
  }

  return number;
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function buildProductPayload(body) {
  const title = normalizeString(body.title);
  const slug = normalizeString(body.slug).toLowerCase();
  const category = normalizeString(body.category) || 'bouquets';
  const price = normalizeNumber(body.price, -1);

  if (title.length < 2) {
    return {
      error: 'Название должно быть не короче 2 символов',
    };
  }

  if (!isValidSlug(slug)) {
    return {
      error: 'Slug должен быть латиницей: buket-taina, buket-romantika',
    };
  }

  if (price < 0) {
    return {
      error: 'Укажите корректную цену',
    };
  }

  return {
    data: {
      title,
      slug,
      category,
      shortDescription: normalizeNullableString(body.shortDescription),
      description: normalizeNullableString(body.description),
      composition: normalizeNullableString(body.composition),
      price,
      oldPrice: normalizeNullableNumber(body.oldPrice),
      berriesCount: normalizeNullableNumber(body.berriesCount),
      image: normalizeNullableString(body.image),
      isActive: normalizeBoolean(body.isActive),
      isHit: normalizeBoolean(body.isHit),
      isSale: normalizeBoolean(body.isSale),
      showOnHome: normalizeBoolean(body.showOnHome),
      sortOrder: normalizeNumber(body.sortOrder, 100),
    },
  };
}

/* AUTH */

router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const login = normalizeString(req.body.login);
    const password = String(req.body.password || '');

    if (!login || !password) {
      return res.status(400).json({
        message: 'Введите логин и пароль',
      });
    }

    if (login !== process.env.ADMIN_LOGIN) {
      return res.status(401).json({
        message: 'Неверный логин или пароль',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH || '',
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Неверный логин или пароль',
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error('Admin session regenerate error:', error);

        return res.status(500).json({
          message: 'Ошибка создания сессии',
        });
      }

      req.session.isAdmin = true;
      createCsrfToken(req);

      req.session.save((saveError) => {
        if (saveError) {
          console.error('Admin session save error:', saveError);

          return res.status(500).json({
            message: 'Ошибка сохранения сессии',
          });
        }

        return res.json({
          message: 'Вход выполнен',
        });
      });
    });
  } catch (error) {
    console.error('Admin login error:', error);

    return res.status(500).json({
      message: 'Ошибка входа',
    });
  }
});

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Admin logout error:', error);

      return res.status(500).json({
        message: 'Ошибка выхода',
      });
    }

    res.clearCookie('secretOfTaste.sid');

    return res.json({
      message: 'Вы вышли из админки',
    });
  });
});

router.get('/check', requireAdmin, (req, res) => {
  res.json({
    isAdmin: true,
  });
});

router.get('/csrf', requireAdmin, (req, res) => {
  res.json({
    csrfToken: req.session.csrfToken || createCsrfToken(req),
  });
});

/* UPLOADS */

router.post(
  '/uploads/product-image',
  requireAdmin,
  validateCsrf,
  handleProductImageUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: 'Выберите фото',
        });
      }

      const fileName = `product-${Date.now()}-${crypto
        .randomBytes(8)
        .toString('hex')}.webp`;

      const filePath = path.join(PRODUCT_UPLOADS_DIR, fileName);

      await sharp(req.file.buffer)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: 84,
        })
        .toFile(filePath);

      return res.status(201).json({
        message: 'Фото загружено',
        imageUrl: `/site/uploads/products/${fileName}`,
      });
    } catch (error) {
      console.error('Admin product image upload error:', error);

      return res.status(400).json({
        message: 'Не удалось обработать изображение',
      });
    }
  },
);

/* PRODUCTS */

router.get('/products', requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    res.json({
      products,
    });
  } catch (error) {
    console.error('Admin products list error:', error);

    res.status(500).json({
      message: 'Не удалось загрузить букеты',
    });
  }
});

router.get('/products/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID букета',
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: 'Букет не найден',
      });
    }

    return res.json({
      product,
    });
  } catch (error) {
    console.error('Admin product detail error:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить букет',
    });
  }
});

router.post('/products', requireAdmin, validateCsrf, async (req, res) => {
  try {
    const payload = buildProductPayload(req.body);

    if (payload.error) {
      return res.status(400).json({
        message: payload.error,
      });
    }

    const product = await prisma.product.create({
      data: payload.data,
    });

    return res.status(201).json({
      message: 'Букет создан',
      product,
    });
  } catch (error) {
    console.error('Admin product create error:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        message: 'Букет с таким slug уже существует',
      });
    }

    return res.status(500).json({
      message: 'Не удалось создать букет',
    });
  }
});

router.patch('/products/:id', requireAdmin, validateCsrf, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID букета',
      });
    }

    const payload = buildProductPayload(req.body);

    if (payload.error) {
      return res.status(400).json({
        message: payload.error,
      });
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: payload.data,
    });

    return res.json({
      message: 'Букет обновлён',
      product,
    });
  } catch (error) {
    console.error('Admin product update error:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        message: 'Букет с таким slug уже существует',
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        message: 'Букет не найден',
      });
    }

    return res.status(500).json({
      message: 'Не удалось обновить букет',
    });
  }
});

router.delete('/products/:id', requireAdmin, validateCsrf, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID букета',
      });
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return res.json({
      message: 'Букет скрыт',
      product,
    });
  } catch (error) {
    console.error('Admin product delete error:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        message: 'Букет не найден',
      });
    }

    return res.status(500).json({
      message: 'Не удалось скрыть букет',
    });
  }
});

/* ORDERS */

const ORDER_STATUSES = new Set([
  'new',
  'in_work',
  'completed',
  'cancelled',
]);

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    return res.json({
      orders,
    });
  } catch (error) {
    console.error('Admin orders list error:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить заявки',
    });
  }
});

router.patch('/orders/:id/status', requireAdmin, validateCsrf, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = normalizeString(req.body.status);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID заявки',
      });
    }

    if (!ORDER_STATUSES.has(status)) {
      return res.status(400).json({
        message: 'Некорректный статус заявки',
      });
    }

    const order = await prisma.order.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: {
        items: true,
      },
    });

    return res.json({
      message: 'Статус заявки обновлён',
      order,
    });
  } catch (error) {
    console.error('Admin order status update error:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        message: 'Заявка не найдена',
      });
    }

    return res.status(500).json({
      message: 'Не удалось обновить статус заявки',
    });
  }
});

module.exports = router;
