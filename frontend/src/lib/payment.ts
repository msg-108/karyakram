/**
 * eSewa Payment Utility
 * Submits an eSewa ePay v2 POST form dynamically to redirect the user to the eSewa portal.
 */

export function submitEsewaForm(res: any): void {
  if (res.payment_url) {
    window.location.href = res.payment_url;
    return;
  }

  if (res.url) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = res.url;

    const fields: Record<string, string> = {
      amount: res.amount,
      tax_amount: res.tax_amount || '0',
      total_amount: res.total_amount,
      transaction_uuid: res.transaction_uuid,
      product_code: res.product_code,
      product_service_charge: res.product_service_charge || '0',
      product_delivery_charge: res.product_delivery_charge || '0',
      success_url: res.success_url,
      failure_url: res.failure_url,
      signed_field_names: res.signed_field_names,
      signature: res.signature,
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = key;
        hiddenInput.value = value;
        form.appendChild(hiddenInput);
      }
    });

    document.body.appendChild(form);
    form.submit();
  }
}
