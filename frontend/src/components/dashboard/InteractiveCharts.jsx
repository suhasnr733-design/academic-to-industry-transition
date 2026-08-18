// frontend/src/components/dashboard/InteractiveCharts.jsx

import React, { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2'
import { motion } from 'framer-motion'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

export const InteractiveBarChart = ({ data, title, height = 300 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: title || 'Data',
        data: data.map(item => item.value),
        backgroundColor: data.map((_, i) => 
          hoveredIndex === i ? '#3b82f6' : '#93c5fd'
        ),
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: '#2563eb'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    onHover: (event, elements) => {
      if (elements && elements.length > 0) {
        setHoveredIndex(elements[0].index)
      } else {
        setHoveredIndex(null)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ height }}
    >
      <Bar data={chartData} options={options} />
    </motion.div>
  )
}

export const InteractiveLineChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: title || 'Trend',
        data: data.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ height }}
    >
      <Line data={chartData} options={options} />
    </motion.div>
  )
}

export const InteractiveDoughnutChart = ({ data, title, height = 300 }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: [
          '#3b82f6',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#06b6d4'
        ],
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 8
      }
    },
    cutout: '60%'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height }}
    >
      <Doughnut data={chartData} options={options} />
    </motion.div>
  )
}