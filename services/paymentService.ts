import { supabase, TABLES } from '../supabase';

// Types
export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
  fields: PaymentMethodField[];
  files?: PaymentMethodFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodFile {
  id: string;
  paymentMethodId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt: Date;
}

export interface PaymentMethodField {
  id: string;
  paymentMethodId: string;
  name: string;
  content: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  name: string;
  description?: string;
  selectedMethods: string[]; // Array of payment method IDs
  components: PaymentComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentComponent {
  id: string;
  paymentId: string;
  type: 'offer' | 'amount' | 'custom';
  label: string;
  value?: string;
  displayOrder: number;
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  userId: string;
  participantName?: string;
  participantEmail?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethodId?: string;
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all payment methods for a user
 */
export const getPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    const { data: methods, error } = await supabase
      .from(TABLES.PAYMENT_METHODS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch fields for each method
    const methodsWithFields = await Promise.all(
      (methods || []).map(async (method) => {
        const { data: fields, error: fieldsError } = await supabase
          .from(TABLES.PAYMENT_METHOD_FIELDS)
          .select('*')
          .eq('payment_method_id', method.id)
          .order('display_order', { ascending: true });

        if (fieldsError) {
          console.error('Error fetching fields:', fieldsError);
        }

        return {
          id: method.id,
          userId: method.user_id,
          name: method.name,
          fields: (fields || []).map((f) => ({
            id: f.id,
            paymentMethodId: f.payment_method_id,
            name: f.name,
            content: f.content,
            displayOrder: f.display_order,
            createdAt: new Date(f.created_at),
          })),
          createdAt: new Date(method.created_at),
          updatedAt: new Date(method.updated_at),
        };
      })
    );

    return methodsWithFields;
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    throw new Error(error.message || 'Failed to fetch payment methods');
  }
};

/**
 * Save or update a payment method
 */
export const savePaymentMethod = async (
  userId: string,
  method: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const methodData: any = {
      user_id: userId,
      name: method.name.trim(),
    };

    let methodId: string;

    if (method.id) {
      // Update existing method
      const { data, error } = await supabase
        .from(TABLES.PAYMENT_METHODS)
        .update(methodData)
        .eq('id', method.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      methodId = data.id;

      // Delete existing fields
      await supabase
        .from(TABLES.PAYMENT_METHOD_FIELDS)
        .delete()
        .eq('payment_method_id', methodId);
    } else {
      // Create new method
      const { data, error } = await supabase
        .from(TABLES.PAYMENT_METHODS)
        .insert(methodData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      methodId = data.id;
    }

    // Insert fields
    if (method.fields && method.fields.length > 0) {
      const fieldsData = method.fields.map((field, index) => ({
        payment_method_id: methodId,
        name: field.name.trim(),
        content: field.content.trim(),
        display_order: index,
      }));

      const { error: fieldsError } = await supabase
        .from(TABLES.PAYMENT_METHOD_FIELDS)
        .insert(fieldsData);

      if (fieldsError) {
        throw fieldsError;
      }
    }

    return methodId;
  } catch (error: any) {
    console.error('Error saving payment method:', error);
    throw new Error(error.message || 'Failed to save payment method');
  }
};

/**
 * Delete a payment method
 */
export const deletePaymentMethod = async (userId: string, methodId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.PAYMENT_METHODS)
      .delete()
      .eq('id', methodId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    throw new Error(error.message || 'Failed to delete payment method');
  }
};

/**
 * Get all payments for a user
 * Batches selections and components into 2 queries instead of 2N
 */
export const getPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const { data: payments, error } = await supabase
      .from(TABLES.PAYMENTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!payments || payments.length === 0) {
      return [];
    }

    const paymentIds = payments.map((p) => p.id);

    // Batch fetch selections and components (2 queries instead of 2N)
    const [selectionsResult, componentsResult] = await Promise.all([
      supabase
        .from(TABLES.PAYMENT_METHOD_SELECTIONS)
        .select('payment_id, payment_method_id')
        .in('payment_id', paymentIds),
      supabase
        .from(TABLES.PAYMENT_COMPONENTS)
        .select('*')
        .in('payment_id', paymentIds)
        .order('display_order', { ascending: true }),
    ]);

    const selectionsByPayment = (selectionsResult.data || []).reduce(
      (acc, s) => {
        if (!acc[s.payment_id]) acc[s.payment_id] = [];
        acc[s.payment_id].push(s.payment_method_id);
        return acc;
      },
      {} as Record<string, string[]>
    );

    const componentsByPayment = (componentsResult.data || []).reduce(
      (acc, c) => {
        if (!acc[c.payment_id]) acc[c.payment_id] = [];
        acc[c.payment_id].push(c);
        return acc;
      },
      {} as Record<string, Array<{ id: string; payment_id: string; type: string; label: string; value: string | null; display_order: number; created_at: string }>>
    );

    return payments.map((payment) => ({
      id: payment.id,
      userId: payment.user_id,
      name: payment.name,
      description: payment.description,
      selectedMethods: selectionsByPayment[payment.id] || [],
      components: (componentsByPayment[payment.id] || []).map((c) => ({
        id: c.id,
        paymentId: c.payment_id,
        type: c.type,
        label: c.label,
        value: c.value,
        displayOrder: c.display_order,
        createdAt: new Date(c.created_at),
      })),
      createdAt: new Date(payment.created_at),
      updatedAt: new Date(payment.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    throw new Error(error.message || 'Failed to fetch payments');
  }
};

/**
 * Save or update a payment
 */
export const savePayment = async (
  userId: string,
  payment: Omit<Payment, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const paymentData: any = {
      user_id: userId,
      name: payment.name.trim(),
      description: payment.description?.trim() || null,
    };

    let paymentId: string;

    if (payment.id) {
      // Update existing payment
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .update(paymentData)
        .eq('id', payment.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      paymentId = data.id;

      // Delete existing selections and components
      await supabase
        .from(TABLES.PAYMENT_METHOD_SELECTIONS)
        .delete()
        .eq('payment_id', paymentId);

      await supabase
        .from(TABLES.PAYMENT_COMPONENTS)
        .delete()
        .eq('payment_id', paymentId);
    } else {
      // Create new payment
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      paymentId = data.id;
    }

    // Insert selected methods
    if (payment.selectedMethods && payment.selectedMethods.length > 0) {
      const selectionsData = payment.selectedMethods.map((methodId) => ({
        payment_id: paymentId,
        payment_method_id: methodId,
      }));

      const { error: selectionsError } = await supabase
        .from(TABLES.PAYMENT_METHOD_SELECTIONS)
        .insert(selectionsData);

      if (selectionsError) {
        throw selectionsError;
      }
    }

    // Insert components
    if (payment.components && payment.components.length > 0) {
      const componentsData = payment.components.map((component, index) => ({
        payment_id: paymentId,
        type: component.type,
        label: component.label.trim(),
        value: component.value?.trim() || null,
        display_order: index,
      }));

      const { error: componentsError } = await supabase
        .from(TABLES.PAYMENT_COMPONENTS)
        .insert(componentsData);

      if (componentsError) {
        throw componentsError;
      }
    }

    return paymentId;
  } catch (error: any) {
    console.error('Error saving payment:', error);
    throw new Error(error.message || 'Failed to save payment');
  }
};

/**
 * Delete a payment
 */
export const deletePayment = async (userId: string, paymentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.PAYMENTS)
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    throw new Error(error.message || 'Failed to delete payment');
  }
};

/**
 * Get all payment transactions for a user
 */
export const getPaymentTransactions = async (userId: string): Promise<PaymentTransaction[]> => {
  try {
    // Get all payments for the user first
    const { data: payments } = await supabase
      .from(TABLES.PAYMENTS)
      .select('id')
      .eq('user_id', userId);

    if (!payments || payments.length === 0) {
      return [];
    }

    const paymentIds = payments.map((p) => p.id);

    const { data: transactions, error } = await supabase
      .from(TABLES.PAYMENT_TRANSACTIONS)
      .select('*')
      .in('payment_id', paymentIds)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw error;
    }

    return (transactions || []).map((t) => ({
      id: t.id,
      paymentId: t.payment_id,
      userId: t.user_id,
      participantName: t.participant_name,
      participantEmail: t.participant_email,
      amount: parseFloat(t.amount),
      currency: t.currency,
      status: t.status,
      paymentMethodId: t.payment_method_id,
      transactionDate: new Date(t.transaction_date),
      notes: t.notes,
      createdAt: new Date(t.created_at),
      updatedAt: new Date(t.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching payment transactions:', error);
    throw new Error(error.message || 'Failed to fetch payment transactions');
  }
};

/**
 * Single payment id fetch + lean transactions for admin dashboard (avoids duplicate getPayments + full row payloads).
 */
export const getDashboardPaymentData = async (
  userId: string
): Promise<{ paymentCount: number; transactions: PaymentTransaction[] }> => {
  try {
    const { data: payments, error: payErr } = await supabase
      .from(TABLES.PAYMENTS)
      .select('id')
      .eq('user_id', userId);

    if (payErr) {
      throw payErr;
    }

    if (!payments || payments.length === 0) {
      return { paymentCount: 0, transactions: [] };
    }

    const paymentIds = payments.map((p) => p.id);

    const { data: transactions, error: txErr } = await supabase
      .from(TABLES.PAYMENT_TRANSACTIONS)
      .select(
        'id, payment_id, user_id, amount, currency, status, transaction_date, participant_name, participant_email, payment_method_id, notes, created_at, updated_at'
      )
      .in('payment_id', paymentIds)
      .order('transaction_date', { ascending: false });

    if (txErr) {
      throw txErr;
    }

    return {
      paymentCount: payments.length,
      transactions: (transactions || []).map((t) => ({
        id: t.id,
        paymentId: t.payment_id,
        userId: t.user_id,
        participantName: t.participant_name,
        participantEmail: t.participant_email,
        amount: parseFloat(t.amount),
        currency: t.currency,
        status: t.status,
        paymentMethodId: t.payment_method_id,
        transactionDate: new Date(t.transaction_date),
        notes: t.notes,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
      })),
    };
  } catch (error: any) {
    console.error('Error fetching dashboard payment data:', error);
    throw new Error(error.message || 'Failed to fetch payment data');
  }
};

/**
 * Save a payment transaction
 */
export const savePaymentTransaction = async (
  transaction: Omit<PaymentTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const transactionData: any = {
      payment_id: transaction.paymentId,
      user_id: transaction.userId,
      participant_name: transaction.participantName || null,
      participant_email: transaction.participantEmail || null,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      payment_method_id: transaction.paymentMethodId || null,
      transaction_date: transaction.transactionDate.toISOString(),
      notes: transaction.notes || null,
    };

    const { data, error } = await supabase
      .from(TABLES.PAYMENT_TRANSACTIONS)
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error: any) {
    console.error('Error saving payment transaction:', error);
    throw new Error(error.message || 'Failed to save payment transaction');
  }
};

/**
 * Update a payment transaction
 */
export const updatePaymentTransaction = async (
  transactionId: string,
  updates: Partial<PaymentTransaction>
): Promise<void> => {
  try {
    const updateData: any = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.participantName !== undefined) updateData.participant_name = updates.participantName;
    if (updates.participantEmail !== undefined) updateData.participant_email = updates.participantEmail;

    const { error } = await supabase
      .from(TABLES.PAYMENT_TRANSACTIONS)
      .update(updateData)
      .eq('id', transactionId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating payment transaction:', error);
    throw new Error(error.message || 'Failed to update payment transaction');
  }
};
