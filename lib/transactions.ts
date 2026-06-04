import { createSupabaseServerClient } from "@/lib/supabaseClient";

export type TransactionStatus = "pending" | "completed" | "failed";

export type TransactionRow = {
  id?: string;
  sender_user_id?: string | null;
  recipient_user_id?: string | null;
  sender_email: string;
  recipient_email: string;
  amount: string;
  message?: string | null;
  status: TransactionStatus | string;
  transaction_id?: string | null;
  circle_response?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateTransactionInput = {
  senderUserId: string;
  recipientUserId: string;
  senderEmail: string;
  recipientEmail: string;
  amount: string;
  message?: string;
  status: TransactionStatus;
  transactionId?: string | null;
  circleResponse?: unknown;
};

export async function saveTransaction({
  senderUserId,
  recipientUserId,
  senderEmail,
  recipientEmail,
  amount,
  message,
  status,
  transactionId,
  circleResponse,
}: CreateTransactionInput): Promise<TransactionRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      sender_user_id: senderUserId,
      recipient_user_id: recipientUserId,
      sender_email: senderEmail,
      recipient_email: recipientEmail,
      amount,
      message: message || null,
      status,
      transaction_id: transactionId ?? null,
      circle_response: circleResponse ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TransactionRow;
}

export async function listTransactionsForUser(
  userId: string,
  limit = 12
): Promise<TransactionRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TransactionRow[];
}
