import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TestDatabaseManager } from './test-database-manager';

/**
 * Integration test setup that provides:
 * - In-memory SQLite database for deterministic tests
 * - Database seeding with factories
 * - Transaction rollback after each test
 * - Shared test utilities and helpers
 */

export class IntegrationTestSetup {
  private static testModule: TestingModule;
  private static dataSource: DataSource;
  private static dbManager: TestDatabaseManager;

  static async getTestModule(): Promise<TestingModule> {
    if (!this.testModule) {
      // Create in-memory database
      this.dbManager = new TestDatabaseManager();
      await this.dbManager.initialize();

      this.testModule = await Test.createTestingModule({
        // Import your actual modules here
        imports: [
          // Add your NestJS modules that need database integration testing
        ],
      })
        .overrideProvider(getDataSourceToken())
        .useValue(this.dbManager.getDataSource())
        .compile();
    }

    return this.testModule;
  }

  static async getDataSource(): Promise<DataSource> {
    if (!this.dataSource) {
      await this.getTestModule();
      this.dataSource = this.testModule.get<DataSource>(getDataSourceToken());
    }
    return this.dataSource;
  }

  static async seedDatabase(seedData?: any): Promise<void> {
    const dataSource = await this.getDataSource();
    await this.dbManager.seedDatabase(dataSource, seedData);
  }

  static async clearDatabase(): Promise<void> {
    const dataSource = await this.getDataSource();
    await this.dbManager.clearDatabase(dataSource);
  }

  static async close(): Promise<void> {
    if (this.testModule) {
      await this.testModule.close();
    }
    if (this.dbManager) {
      await this.dbManager.close();
    }
  }
}

// Global test hooks for integration tests
beforeAll(async () => {
  await IntegrationTestSetup.getTestModule();
});

afterEach(async () => {
  await IntegrationTestSetup.clearDatabase();
});

afterAll(async () => {
  await IntegrationTestSetup.close();
});
