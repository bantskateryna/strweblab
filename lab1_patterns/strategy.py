from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float) -> str:
        pass

class CardPayment(PaymentStrategy):
    def __init__(self, last4: str):
        self._last4 = last4

    def pay(self, amount: float) -> str:
        return f"Card *{self._last4}: charge {amount} UAH"

class PayPalPayment(PaymentStrategy):
    def __init__(self, email: str):
        self._email = email

    def pay(self, amount: float) -> str:
        return f"PayPal ({self._email}): charge {amount} UAH"

class CryptoPayment(PaymentStrategy):
    def pay(self, amount: float) -> str:
        usd = round(amount / 40, 2)
        return f"Crypto: charge ~{usd} USDT"


class Checkout:
    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def set_payment(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def process(self, amount: float) -> str:
        return self._strategy.pay(amount)


checkout = Checkout(CardPayment("4242"))
print(checkout.process(1500))

checkout.set_payment(PayPalPayment("user@gmail.com"))
print(checkout.process(800))

checkout.set_payment(CryptoPayment())
print(checkout.process(3200))
