import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const hospitals = await prisma.hospital.findMany();
  console.log("Hospitals:", JSON.stringify(hospitals, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
