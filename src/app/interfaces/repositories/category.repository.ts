import {Category} from "@prisma/client";

export interface CategoryRepository {
    findById(id: number): Promise<Category | null>;
    findByName(name: string): Promise<Category | null>;
    create(category: Category): Promise<void>;
    update(category: Partial<Category>): Promise<void>;
    delete(id: number): Promise<void>;
    findAll(): Promise<Category[] | null>;
}
