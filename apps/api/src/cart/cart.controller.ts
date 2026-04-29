import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from '../dtos/cart/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  async addToCart(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addToCart(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:id')
  async updateQuantity(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(userId, itemId, quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  async removeFromCart(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeFromCart(userId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateCart(@CurrentUser('id') userId: string) {
    return this.cartService.validateCartItems(userId);
  }
}