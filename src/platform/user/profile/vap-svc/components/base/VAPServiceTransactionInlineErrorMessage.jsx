import React from 'react';

export default function VAPServiceTransactionInlineErrorMessage({
  title: fieldTitle,
}) {
  return (
    <div className="usa-input-error-message">
      We couldn’t save your recent {fieldTitle.toLowerCase()} update. Please try
      again later.
    </div>
  );
}
