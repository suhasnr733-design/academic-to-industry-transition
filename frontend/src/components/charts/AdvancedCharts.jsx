// frontend/src/components/charts/AdvancedCharts.jsx

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
  Filler,
  RadialLinearScale
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, Radar, Scatter } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'

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
  Filler,
  RadialLinearScale
)

export const AdvancedBarChart = ({ data, title, height = 300, stacked = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || `hsl(${index * 60}, 70%, 60%)`,
      borderColor: dataset.borderColor || `hsl(${index * 60}, 70%, 50%)`,
      borderWidth: 2,
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.7
    }))
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || ''
            let value = context.raw
            if (value) {
              label += `: ${value.toLocaleString()}`
            }
            return label
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        stacked: stacked
      },
      x: {
        grid: {
          display: false
        },
        stacked: stacked
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

export const AdvancedPieChart = ({ data, title, height = 300, doughnut = false }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: [
          '#3b82f6',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#06b6d4',
          '#ec4899',
          '#84cc16'
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
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.label || ''
            let value = context.raw
            let total = context.dataset.data.reduce((a, b) => a + b, 0)
            let percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value.toLocaleString()} (${percentage}%)`
          }
        }
      }
    },
    cutout: doughnut ? '60%' : '0%'
  }

  const ChartComponent = doughnut ? Doughnut : Pie

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height }}
    >
      <ChartComponent data={chartData} options={options} />
    </motion.div>
  )
}

export const RadarChart = ({ data, height = 300 }) => {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || `rgba(${index * 60}, 130, 246, 0.2)`,
      borderColor: dataset.borderColor || `rgb(${index * 60}, 130, 246)`,
      pointBackgroundColor: dataset.borderColor || `rgb(${index * 60}, 130, 246)`,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: `rgb(${index * 60}, 130, 246)`
    }))
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, rotate: -10 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.5 }}
      style={{ height }}
    >
      <Radar data={chartData} options={options} />
    </motion.div>
  )
}