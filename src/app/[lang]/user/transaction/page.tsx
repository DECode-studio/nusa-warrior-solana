import React, { Suspense } from "react";
import { TransactionView } from "@/client/presentation/views/user";

export default function UserTransactionPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <TransactionView />
    </Suspense>
  );
}
