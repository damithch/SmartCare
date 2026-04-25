let prismaClient = null;

const isPostgresProvider = () => process.env.DATABASE_PROVIDER === "postgres";

export const getPrismaClient = async () => {
  if (!isPostgresProvider()) {
    throw new Error("Prisma client requested while DATABASE_PROVIDER is not set to postgres");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!prismaClient) {
    const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
      import("@prisma/client"),
      import("@prisma/adapter-pg")
    ]);

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL
    });

    prismaClient = new PrismaClient({ adapter });
  }

  return prismaClient;
};

const createModelProxy = (modelName) =>
  new Proxy(
    {},
    {
      get(_target, operation) {
        return async (...args) => {
          const client = await getPrismaClient();
          return client[modelName][operation](...args);
        };
      }
    }
  );

const prisma = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === "$disconnect" || property === "$transaction") {
        return async (...args) => {
          const client = await getPrismaClient();

          if (property === "$transaction") {
            return client.$transaction(...args);
          }

          if (prismaClient) {
            await client.$disconnect();
            prismaClient = null;
          }
        };
      }

      return createModelProxy(property);
    }
  }
);

export default prisma;
