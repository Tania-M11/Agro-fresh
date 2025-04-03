import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

export const createSession = async (req, res) => {
  try {
    // Obtener los ítems del carrito desde el cuerpo de la solicitud
    const { items } = req.body;

    // Crear los line_items para Stripe Checkout
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd', // Cambiar a la moneda preferida
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convertir a centavos
      },
      quantity: item.quantity,
    }));

    // Crear la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: new URL('../../../frontend/finalizar.html', import.meta.url).href,
      cancel_url: new URL('../../../frontend/cancelar.html', import.meta.url).href,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'MX'], // Agregar los países a los que envías
      },
    });

    // Responder con la URL de la sesión de pago
    res.json({ checkoutUrl: session.url });

  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ 
      message: 'Error creating checkout session', 
      error: error.message 
    });
  }
};
