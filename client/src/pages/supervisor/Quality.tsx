import { useState } from 'react';
import QualityForm from '../../components/QualityForm';
import { page } from '../../design';
import { toISODate } from '../../lib/date';

export default function Quality() {
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  return (
    <div className={`${page.shell} max-w-3xl`}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Quality Control</h1>
          <p className={page.subtitle}>Enter total pieces checked and faults found for the day</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className={page.dateInput}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <QualityForm date={selectedDate} />
    </div>
  );
}
