import { envConfig } from '@/config/env.config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { CorrelationMiddleware } from './middleware/correlation.middleware';
import { ErrorHandlerMiddleware } from './middleware/error-handler.middleware';
import { PerformanceMiddleware } from './middleware/performance.middleware';

async function bootstrap() {
  // Use Fastify adapter for better performance
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    })
  );

  // Enable global validation pipes with enhanced security
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Enhanced CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        envConfig.app.baseUrl,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://udigit-rentals.vercel.app',
      ];

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
  });

  // Register Fastify plugins for enhanced security and performance
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  });

  // Rate limiting with Fastify
  await app.register(require('@fastify/rate-limit'), {
    max: 100, // requests per window
    timeWindow: '15 minutes',
    keyGenerator: (request: any) => {
      // Use IP address for rate limiting
      return request.raw.ip || request.raw.connection.remoteAddress || 'unknown';
    },
    errorResponseBuilder: (request: any, context: any) => ({
      error: 'Too many requests',
      message: 'Rate limit exceeded, retry later',
      retryAfter: context.after,
    }),
  });

  // Add our custom middleware (before routes)
  app.use(CorrelationMiddleware.handle);
  app.use(PerformanceMiddleware.handle);

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('U-Dig It Rentals API')
    .setDescription('Kubota SVL-75 Rental Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Bookings', 'Equipment booking management')
    .addTag('Payments', 'Payment processing')
    .addTag('Contracts', 'Contract and signature management')
    .addTag('Insurance', 'Insurance verification')
    .addTag('Admin', 'Administrative functions')
    .addServer(envConfig.app.baseUrl || 'http://localhost:3001')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // Global error handling (must be last middleware)
  app.use(ErrorHandlerMiddleware.handle);

  // Start the server
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 U-Dig It Rentals API is running on: ${await app.getUrl()}`);
  console.log(`📚 API Documentation available at: ${await app.getUrl()}/api`);
  console.log(`🔒 Security: Fastify + Helmet + Rate limiting enabled`);
}

bootstrap();
