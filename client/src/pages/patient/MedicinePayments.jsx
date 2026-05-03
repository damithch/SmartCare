import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCardIcon, PillIcon, ReceiptIcon, WalletIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { confirmBillPayment, createBillCheckout, fetchMyBills } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'react-hot-toast';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const safeLoadStripe = (publishableKey) => {
  if (!publishableKey) {
    return Promise.resolve(null);
  }

  return loadStripe(publishableKey).catch(() => null);
};

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      '::placeholder': {
        color: '#94a3b8'
      }
    },
    invalid: {
      color: '#dc2626'
    }
  }
};

const MedicineBillPaymentForm = ({ bill, checkout, token, user, onCancel, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const submitPayment = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      const result = await stripe.confirmCardPayment(checkout.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.fullName || user.name || 'Patient',
            email: user.email
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      if (!result.paymentIntent || result.paymentIntent.status !== 'succeeded') {
        throw new Error('Stripe payment was not completed');
      }

      const payment = await confirmBillPayment(token, {
        bill: bill._id,
        paymentIntentId: result.paymentIntent.id
      });

      onSuccess(payment);
    } catch (error) {
      setPaymentError(error.message || 'Payment failed');
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitPayment} className="mt-5 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <div>
        <p className="font-semibold text-slate-900">Stripe card payment</p>
        <p className="mt-1 text-sm text-slate-600">Use test card 4242 4242 4242 4242 with any future date and CVC.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <CardElement options={cardElementOptions} />
      </div>
      {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="sm:flex-1" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="sm:flex-1" isLoading={isSubmitting} disabled={!stripe}>
          Pay {formatCurrency(checkout.amount)}
        </Button>
      </div>
    </form>
  );
};

export const MedicinePayments = () => {
  const { user, token } = useAppContext();
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBillId, setActiveBillId] = useState('');
  const [checkout, setCheckout] = useState(null);
  const [stripeLoadError, setStripeLoadError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return undefined;
    }

    let isMounted = true;

    const loadBills = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError('');
        }

        const data = await fetchMyBills(token);

        if (isMounted) {
          setBills(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load medicine bills');
          setBills([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBills();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const medicineBills = useMemo(
    () => bills
      .filter((bill) => Array.isArray(bill.billItems) && bill.billItems.some((item) => item.category === 'medicine'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [bills]
  );

  const stripePromise = useMemo(
    () => (checkout?.publishableKey ? safeLoadStripe(checkout.publishableKey) : null),
    [checkout?.publishableKey]
  );

  useEffect(() => {
    let isMounted = true;

    if (!stripePromise) {
      setStripeLoadError('');
      return undefined;
    }

    stripePromise.then((stripeInstance) => {
      if (!isMounted) {
        return;
      }

      setStripeLoadError(stripeInstance ? '' : 'Stripe payment form could not be loaded. Check your internet connection or Stripe key and try again.');
    });

    return () => {
      isMounted = false;
    };
  }, [stripePromise]);

  const startMedicineBillPayment = async (bill) => {
    if (!token) {
      return;
    }

    setActiveBillId(bill._id);
    setError('');
    setSuccessMessage('');

    try {
      const nextCheckout = await createBillCheckout(token, { bill: bill._id });
      setCheckout(nextCheckout);
    } catch (err) {
      setError(err.message || 'Failed to initialize Stripe payment');
      toast.error(err.message || 'Failed to initialize Stripe payment');
    } finally {
      setActiveBillId('');
    }
  };

  const handlePaymentSuccess = (payment) => {
    const paidBillId = payment?.bill?._id || payment?.bill || checkout?.billId;
    setBills((current) =>
      current.map((item) => item._id === paidBillId ? { ...item, status: 'paid', amountDue: 0, amountPaid: Number(item.amountPaid || 0) + Number(payment?.amount || item.amountDue || 0) } : item)
    );
    setCheckout(null);
    setSuccessMessage(`Medicine bill ${payment?.bill?.billNumber || checkout?.billNumber || ''} paid successfully.`);
    toast.success('Medicine bill paid successfully.');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Pay medicine bills generated from your doctor prescriptions.</p>
        </div>
        <Badge variant="info" className="px-3 py-1 text-sm">
          {medicineBills.filter((bill) => bill.status !== 'paid').length} unpaid
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

      {isLoading ? (
        <Card className="p-12 text-center">
          <ReceiptIcon className="mx-auto mb-4 h-8 w-8 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900">Loading medicine bills</h2>
          <p className="mt-1 text-sm text-slate-500">Fetching bills generated from your prescriptions.</p>
        </Card>
      ) : medicineBills.length > 0 ? (
        <div className="space-y-4">
          {medicineBills.map((bill, index) => (
            <motion.div
              key={bill._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <PillIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{bill.billNumber}</h2>
                        <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'} className="capitalize">
                          {bill.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Created {new Date(bill.createdAt).toLocaleDateString()} • Due {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <div className="mt-4 space-y-2">
                        {bill.billItems.filter((item) => item.category === 'medicine').map((item, itemIndex) => (
                          <div key={`${bill._id}-item-${itemIndex}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <span className="font-medium text-slate-900">{item.description}</span>
                            <span className="ml-2 text-slate-500">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[220px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Amount Due</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(bill.amountDue)}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <WalletIcon className="h-4 w-4" />
                      Payment method: Card
                    </div>
                    <Button
                      className="mt-4 w-full"
                      isLoading={activeBillId === bill._id}
                      disabled={bill.status === 'paid' || Number(bill.amountDue || 0) <= 0}
                      onClick={() => startMedicineBillPayment(bill)}
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      {bill.status === 'paid' ? 'Paid' : checkout?.billId === bill._id ? 'Payment Started' : 'Pay with Stripe'}
                    </Button>
                  </div>
                </div>
                {checkout?.billId === bill._id && (
                  stripeLoadError ? (
                    <p className="mt-4 text-sm text-red-600">{stripeLoadError}</p>
                  ) : stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
                      <MedicineBillPaymentForm
                        bill={bill}
                        checkout={checkout}
                        token={token}
                        user={user}
                        onCancel={() => setCheckout(null)}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  ) : null
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <PillIcon className="mx-auto mb-4 h-8 w-8 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900">No medicine bills</h2>
          <p className="mt-1 text-sm text-slate-500">Bills for prescribed medicines will appear here after your doctor issues them.</p>
        </Card>
      )}
    </div>
  );
};
