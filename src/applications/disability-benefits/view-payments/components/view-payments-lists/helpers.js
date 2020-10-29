import React from 'react';
import moment from 'moment';

export const paymentsReceivedFields = [
  {
    label: 'Date',
    value: 'payCheckDt',
  },
  {
    label: 'Amount',
    value: 'payCheckAmount',
  },
  {
    label: 'Type',
    value: 'payCheckType',
  },
  {
    label: 'Method',
    value: 'paymentMethod',
  },
  {
    label: 'Bank',
    value: 'bankName',
  },
  {
    label: 'Account',
    value: 'accountNumber',
  },
];

export const paymentsReturnedFields = [
  {
    label: 'Issue Date',
    value: 'returnedCheckIssueDt',
  },
  {
    label: 'Cancel Date',
    value: 'returnedCheckCancelDt',
  },
  {
    label: 'Amount',
    value: 'returnedCheckAmount',
  },
  {
    label: 'Check #',
    value: 'returnedCheckNumber',
  },
  {
    label: 'Type',
    value: 'returnedCheckType',
  },
  {
    label: 'Reason',
    value: 'returnReason',
  },
];

export const clientServerErrorContent = receivedOrReturned => (
  <>
    <h3>No {receivedOrReturned} payments</h3>
    <p>We were unable to get {receivedOrReturned} payments for your account.</p>
  </>
);

export const paymentsReceivedContent = (
  <>
    <h3 id="paymentsRecievedHeader" className="vads-u-font-size--xl">
      Payments you received
    </h3>
    <p id="paymentsRecievedContent">
      We pay benefits on the first day of the month for the previous month. If
      the first day of the month is a weekend or holiday, we pay benefits on the
      last business day before the 1st. For example, if May 1 is a Saturday,
      we’d pay benefits on Friday, April 30.
    </p>
  </>
);

export const paymentsReturnedContent = (
  <>
    <h3 id="paymentsReturnedHeader" className="vads-u-font-size--xl">
      Payments returned
    </h3>
    <p id="paymentsReturnedContent">
      Returned payment information is available for 6 years from the date the
      payment was issued.
    </p>
  </>
);

export const filterReturnPayments = payments => {
  return payments.filter(payment => {
    for (const [key] of Object.entries(payment)) {
      if (payment[key] !== null) {
        return true;
      }
    }
    return false;
  });
};

export const reformatReturnPaymentDates = payments => {
  return payments.map(payment => {
    return {
      ...payment,
      returnedCheckCancelDt: payment.returnedCheckCancelDt
        ? moment(payment.returnedCheckCancelDt).format('MMM D, YYYY')
        : null,
      returnedCheckIssueDt: payment.returnedCheckIssueDt
        ? moment(payment.returnedCheckIssueDt).format('MMM D, YYYY')
        : null,
    };
  });
};

export const reformatPaymentDates = payments => {
  return payments.map(payment => {
    return {
      ...payment,
      payCheckDt: moment(payment.payCheckDt).format('MMM D, YYYY'),
    };
  });
};
