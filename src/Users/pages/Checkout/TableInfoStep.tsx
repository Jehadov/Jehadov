import React, { useState } from 'react';

interface TableInfoStepProps {
  initialData?: { name: string; tableNumber: string };
  onNext: (data: { name: string; tableNumber: string }) => void;
  onBack?: () => void;
}

export default function TableInfoStep({ initialData, onNext, onBack }: TableInfoStepProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [tableNumber, setTableNumber] = useState(initialData?.tableNumber || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!tableNumber.trim()) {
      alert('Please enter your table number.');
      return;
    }
    onNext({ name, tableNumber });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h2>Table Information</h2>

      <div className="mb-3">
        <label>Name:</label>
        <input
          className="form-control"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="mb-3">
        <label>Table Number:</label>
        <input
          className="form-control"
          value={tableNumber}
          onChange={e => setTableNumber(e.target.value)}
          required
        />
      </div>

      <div className="d-flex justify-content-between">
        {onBack && (
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          Next
        </button>
      </div>
    </form>
  );
}
