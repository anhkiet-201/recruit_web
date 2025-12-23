import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.warn('ADMIN_EMAIL and ADMIN_PASSWORD must be provided in .env to seed admin user.');
        console.warn('Skipping admin seed...');
        return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        console.log(`Creating admin user: ${adminEmail}...`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'System Admin',
                role: 'admin',
            },
        });

        console.log(`Admin user ${adminEmail} created successfully.`);
    } else {
        console.log(`Admin user ${adminEmail} already exists. Skipping creation.`);
    }
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
