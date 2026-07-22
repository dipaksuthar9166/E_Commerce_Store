import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// आज की प्रति घंटा बिक्री के लिए डमी डेटा
const data = [
  { name: '9 AM', sales: 2400 },
  { name: '10 AM', sales: 1398 },
  { name: '11 AM', sales: 9800 },
  { name: '12 PM', sales: 3908 },
  { name: '1 PM', sales: 4800 },
  { name: '2 PM', sales: 3800 },
  { name: '3 PM', sales: 4300 },
  { name: '4 PM', sales: 5100 },
];

// बेहतर लुक के लिए कस्टम टूलटिप कंपोनेंट
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white rounded-lg shadow-md border border-gray-200">
        <p className="label text-sm text-gray-700">{`${label}`}</p>
        <p className="intro text-base font-bold text-gray-900">{`Sales: ₹${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const TodayActivityChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 10,
          left: -20, // Y-अक्ष लेबल छिपा होने पर संरेखित करने के लिए समायोजित करें
          bottom: 5,
        }}
      >
        {/* X-अक्ष कॉन्फ़िगर करें: लाइन छिपाएँ, लेबल रखें */}
        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />

        {/* Y-अक्ष कॉन्फ़िगर करें: सब कुछ छिपाएँ */}
        <YAxis axisLine={false} tickLine={false} hide={true} />

        {/* कस्टम टूलटिप */}
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ fill: 'rgba(196, 220, 252, 0.3)' }} 
        />
        
        {/* कस्टम रंग और गोल कोनों वाला बार */}
        <Bar dataKey="sales" fill="#c4dcfc" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TodayActivityChart;