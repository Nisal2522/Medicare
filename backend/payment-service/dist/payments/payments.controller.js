"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const confirm_intent_dto_1 = require("./dto/confirm-intent.dto");
const create_checkout_session_dto_1 = require("./dto/create-checkout-session.dto");
const create_intent_dto_1 = require("./dto/create-intent.dto");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    payments;
    constructor(payments) {
        this.payments = payments;
    }
    createCheckout(dto) {
        return this.payments.createCheckoutSession(dto);
    }
    createIntent(dto) {
        return this.payments.createPaymentIntent(dto);
    }
    reconcileIntent(dto) {
        return this.payments.reconcileIntent(dto);
    }
    confirmIntent(dto) {
        return this.payments.confirmIntent(dto);
    }
    config() {
        return this.payments.publishableKey();
    }
    webhook(signature, req) {
        const raw = req.rawBody;
        if (!Buffer.isBuffer(raw)) {
            throw new common_1.BadRequestException('Raw body required for Stripe webhook');
        }
        return this.payments.handleStripeWebhook(raw, signature ?? '');
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('create-checkout-session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checkout_session_dto_1.CreateCheckoutSessionDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Post)('create-intent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_intent_dto_1.CreateIntentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createIntent", null);
__decorate([
    (0, common_1.Post)('reconcile-intent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_intent_dto_1.CreateIntentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "reconcileIntent", null);
__decorate([
    (0, common_1.Post)('confirm-intent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [confirm_intent_dto_1.ConfirmIntentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "confirmIntent", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "config", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)('stripe-signature')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "webhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map