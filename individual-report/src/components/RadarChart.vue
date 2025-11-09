<template>
  <div class="radar-chart-container">
    <Radar v-if="chartData" :data="chartData" :options="chartOptions" />
    <p v-else class="no-data">No VESPA data available</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps({
  allScores: {
    type: Array,
    required: true
  },
  selectedCycle: {
    type: Number,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const chartData = computed(() => {
  if (!props.allScores || props.allScores.length === 0) {
    return null
  }

  const labels = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude']
  const datasets = []

  // Theme colors for category dots
  const pointColors = [
    '#ff8f00',  // Vision - Orange
    '#86b4f0',  // Effort - Blue
    '#72cb44',  // Systems - Green
    '#7f31a4',  // Practice - Purple
    '#f032e6'   // Attitude - Pink
  ]

  // Cycle colors - bright and distinct
  const cycleConfigs = [
    { cycle: 1, color: 'rgba(255, 215, 0, 1)', fillColor: 'rgba(255, 215, 0, 0.2)', borderDash: [] },      // Bright Yellow
    { cycle: 2, color: 'rgba(0, 123, 255, 1)', fillColor: 'rgba(0, 123, 255, 0.2)', borderDash: [] },      // Bright Blue
    { cycle: 3, color: 'rgba(255, 0, 0, 1)', fillColor: 'rgba(255, 0, 0, 0.2)', borderDash: [] }           // Bright Red
  ]

  // Progressive display: Show only up to selected cycle
  // Cycle 1 button → Show only C1
  // Cycle 2 button → Show C1 + C2
  // Cycle 3 button → Show C1 + C2 + C3
  const cyclesToShow = props.allScores.filter(s => s.cycle <= props.selectedCycle)

  cyclesToShow.forEach(scoreData => {
    const config = cycleConfigs.find(c => c.cycle === scoreData.cycle)
    if (!config) return

    const data = [
      scoreData.vision || 0,
      scoreData.effort || 0,
      scoreData.systems || 0,
      scoreData.practice || 0,
      scoreData.attitude || 0
    ]

    const isSelected = scoreData.cycle === props.selectedCycle

    datasets.push({
      label: `Cycle ${scoreData.cycle}`,
      data: data,
      backgroundColor: config.fillColor,
      borderColor: config.color,
      borderWidth: isSelected ? 4 : 3,
      borderDash: config.borderDash,
      pointBackgroundColor: pointColors, // Use theme colors for dots
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: pointColors,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3,
      pointRadius: isSelected ? 7 : 6,
      pointHoverRadius: 10,
      fill: true
    })
  })

  return {
    labels,
    datasets
  }
})

const chartOptions = computed(() => {
  // Theme colors for category labels
  const labelColors = {
    'Vision': '#ff8f00',     // Orange
    'Effort': '#86b4f0',     // Blue
    'Systems': '#72cb44',    // Green
    'Practice': '#7f31a4',   // Purple
    'Attitude': '#f032e6'    // Pink
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: props.compact ? 1 : 1.1,
    scales: {
      r: {
        min: 0,
        max: 10,
        beginAtZero: true,
        ticks: {
          stepSize: 2,
          font: {
            size: props.compact ? 9 : 14,
            weight: '700'
          },
          color: props.compact ? 'rgba(255, 255, 255, 0.9)' : '#555',
          backdropColor: props.compact ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
          showLabelBackdrop: true
        },
        pointLabels: {
          font: {
            size: props.compact ? 11 : 16,
            weight: '800'
          },
          color: (context) => {
            const label = context.label
            return props.compact ? 'white' : labelColors[label] || '#333'
          }
        },
        grid: {
          color: props.compact ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
          lineWidth: 2
        },
        angleLines: {
          color: props.compact ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          lineWidth: 2
        },
        backgroundColor: props.compact ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 245, 245, 0.5)'
      }
    },
    plugins: {
      legend: {
        display: !props.compact,
        position: 'bottom',
        labels: {
          font: {
            size: 15,
            weight: '700'
          },
          color: '#079baa',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(7, 155, 170, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: props.compact ? 10 : 16,
        titleFont: {
          size: props.compact ? 13 : 16,
          weight: 'bold'
        },
        bodyFont: {
          size: props.compact ? 12 : 15,
          weight: '600'
        },
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.r}/10`
          }
        }
      }
    }
  }
  
  return baseOptions
})
</script>

<style scoped>
.radar-chart-container {
  width: 100%;
  max-width: v-bind('compact ? "280px" : "650px"');
  padding: v-bind('compact ? "15px" : "30px"');
  display: flex;
  justify-content: center;
  align-items: center;
  background: v-bind('compact ? "transparent" : "white"');
  border-radius: v-bind('compact ? "0" : "16px"');
  box-shadow: v-bind('compact ? "none" : "0 4px 20px rgba(0, 0, 0, 0.08)"');
  margin: v-bind('compact ? "0" : "0 auto"');
}

.no-data {
  color: v-bind('compact ? "rgba(255, 255, 255, 0.8)" : "#999"');
  font-size: v-bind('compact ? "12px" : "16px"');
  text-align: center;
}

@media (max-width: 1024px) {
  .radar-chart-container {
    max-width: v-bind('compact ? "220px" : "550px"');
    padding: v-bind('compact ? "10px" : "25px"');
  }
}

@media (max-width: 768px) {
  .radar-chart-container {
    max-width: 100%;
    padding: v-bind('compact ? "10px" : "20px"');
  }
}

@media print {
  .radar-chart-container {
    display: flex !important;
    max-width: 28mm !important;
    max-height: 28mm !important;
    break-inside: avoid !important;
    box-shadow: none !important;
    padding: 1mm !important;
    background: transparent !important;
  }
  
  canvas {
    display: block !important;
    max-width: 28mm !important;
    max-height: 28mm !important;
  }
}
</style>

