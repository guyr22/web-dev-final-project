import { Request, Response } from 'express';
import { Model } from 'mongoose';

export class BaseController<T> {
    model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async getAll(req: Request, res: Response) {
        try {
            const filter = req.query;
            const items = await this.model.find(filter);
            res.send(items);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            res.send(item);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const item = await this.model.create(req.body);
            res.status(201).send(item);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const item = await this.model.findByIdAndDelete(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            res.json({ message: 'Item deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const item = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            res.json(item);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    }
}
