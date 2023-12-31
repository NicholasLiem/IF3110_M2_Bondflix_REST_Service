import {Content, PrismaClient} from '@prisma/client';
import {ContentRepository} from '../../../interfaces/repositories/content.repository';

const prisma = new PrismaClient();

export class ContentRepositoryPrisma implements ContentRepository {
    async create(content: Content): Promise<Content> {
        return prisma.content.create({ data: content });
    }

    async delete(id: number) {
        await prisma.content.delete({ where: { id } });
    }

    async findByTitle(title: string): Promise<Content | null> {
        // @ts-ignore
        return prisma.content.findMany({
            where: {
                title: {
                    contains: title,
                }
            },
            select: {
                id: true,
                creator_id: true,
                title: true,
                description: true,
                visibility: true,
                content_file_path: true,
                thumbnail_file_path: true,
                uploaded_at: true,
            }
        });
    }

    async findById(id: number) {
        if (isNaN(id)) {
            throw new Error(`Invalid ID: ${id}`);
        }

        return prisma.content.findUnique({
            where: { id: id },
            include: {
                user: true,
                genres: true,
                categories: true,
                sponsors: true
            },
        });
    }

    async update(content: Partial<Content>) {
        const contentId = content.id;

        // @ts-ignore
        if (contentId === undefined) {
            throw new Error("Content ID is required for update.");
        }

        await prisma.content.update({
            where: { id: contentId },
            data: content,
        });
    }

    async findAll() {
        return prisma.content.findMany({
            include: {
                user: true,
                genres: true,
                categories: true,
                sponsors: true
            },
        });
    }

    async associateGenres(contentId: number, genres: number[]): Promise<void> {
        const validGenreIds = [];
        for (const genreId of genres) {
            const genreExists = await prisma.genre.findUnique({
                where: { id: genreId },
            });
            if (genreExists) {
                validGenreIds.push(genreId);
            } else {
                console.warn(`Genre ID ${genreId} does not exist.`);
            }
        }

        if (validGenreIds.length > 0) {
            await prisma.content.update({
                where: { id: contentId },
                data: {
                    genres: {
                        connect: validGenreIds.map((id) => ({ id })),
                    },
                },
            });
        } else {
            throw new Error("No valid genre IDs provided.");
        }
    }

    async associateSponsors(contentId: number, sponsors: number[]): Promise<void> {
        const validSponsors = [];
        for (const sponsorId of sponsors) {
            const sponsorExist = await prisma.sponsor.findUnique({
                where: { id: sponsorId },
            });
            if (sponsorExist) {
                validSponsors.push(sponsorId);
            } else {
                console.warn(`Sponsor ID ${sponsorId} does not exist.`);
            }
        }

        if (validSponsors.length > 0) {
            await prisma.content.update({
                where: { id: contentId },
                data: {
                    sponsors: {
                        connect: validSponsors.map((id) => ({ id })),
                    },
                },
            });
        } else {
            throw new Error("No valid sponsor IDs provided.");
        }
    }

    async associateCategories(
        contentId: number,
        categories: number[]
    ): Promise<void> {
        const validCategoryIds = [];
        for (const categoryId of categories) {
            const categoryExists = await prisma.category.findUnique({
                where: { id: categoryId },
            });
            if (categoryExists) {
                validCategoryIds.push(categoryId);
            } else {
                console.warn(`Category ID ${categoryId} does not exist.`);
            }
        }

        if (validCategoryIds.length > 0) {
            await prisma.content.update({
                where: { id: contentId },
                data: {
                    categories: {
                        connect: validCategoryIds.map((id) => ({ id })),
                    },
                },
            });
        } else {
            throw new Error("No valid category IDs provided.");
        }
    }

    async findContentByCreatorId(creatorId: number): Promise<Content[] | null> {
        return prisma.content.findMany({
            where: {
                creator_id: creatorId
            },
            include: {
                genres: true,
                categories: true,
                sponsors: true
            }
        })
    }
}
