import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Could not find this customer in database');
    }

    const dbProducts = await this.productsRepository.findAllById(products);

    const foundProductIDs = dbProducts.map(dbProduct => dbProduct.id);

    const productsIDCheck = products.filter(
      product => !foundProductIDs.includes(product.id),
    );

    if (productsIDCheck) {
      throw new AppError('Some products were not found in database');
    }

    const producstOrder = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: dbProducts.filter(p => p.id === product.id)[0].quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: producstOrder,
    });
    return order;
  }
}
//       price: dbProducts.find(p => p.id === product.id).price,

export default CreateOrderService;
