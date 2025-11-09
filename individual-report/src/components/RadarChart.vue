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

  // Cycle colors and styles
  const cycleConfigs = [
    { cycle: 1, color: 'rgba(7, 155, 170, 0.8)', borderDash: [] },
    { cycle: 2, color: 'rgba(123, 216, 208, 0.8)', borderDash: [5, 5] },
    { cycle: 3, color: 'rgba(98, 209, 210, 0.8)', borderDash: [10, 5] }
  ]

  // Add dataset for each completed cycle
  props.allScores.forEach(scoreData => {
    const config = cycleConfigs.find(c => c.cycle === scoreData.cycle)
    if (!config) return

    const data = [
      scoreData.vision || 0,
      scoreData.effort || 0,
      scoreData.systems || 0,
      scoreData.practice || 0,
      scoreData.attitude || 0
    ]

    datasets.push({
      label: `Cycle ${scoreData.cycle}`,
      data: data,
      backgroundColor: config.color.replace('0.8', '0.2'),
      borderColor: config.color,
      borderWidth: scoreData.cycle === props.selectedCycle ? 3 : 2,
      borderDash: config.borderDash,
      pointBackgroundColor: config.color,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: config.color,
      pointRadius: scoreData.cycle === props.selectedCycle ? 6 : 4,
      pointHoverRadius: 8
    })
  })

  return {
    labels,
    datasets
  }
})

const chartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: props.compact ? 1 : 1.2,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          font: {
            size: props.compact ? 9 : 12,
            weight: '600'
          },
          color: props.compact ? 'rgba(255, 255, 255, 0.8)' : '#666'
        },
        pointLabels: {
          font: {
            size: props.compact ? 11 : 14,
            weight: '700'
          },
          color: props.compact ? 'white' : '#333'
        },
        grid: {
          color: props.compact ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: props.compact ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: !props.compact,
        position: 'bottom',
        labels: {
          font: {
            size: 13,
            weight: '600'
          },
          color: '#333',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: props.compact ? 8 : 12,
        titleFont: {
          size: props.compact ? 12 : 14,
          weight: 'bold'
        },
        bodyFont: {
          size: props.compact ? 11 : 13
        },
        callbacks: {
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
  max-width: v-bind('compact ? "250px" : "600px"');
  padding: v-bind('compact ? "10px" : "20px"');
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-data {
  color: v-bind('compact ? "rgba(255, 255, 255, 0.8)" : "#999"');
  font-size: v-bind('compact ? "12px" : "16px"');
  text-align: center;
}

@media (max-width: 1024px) {
  .radar-chart-container {
    max-width: v-bind('compact ? "200px" : "500px"');
    padding: v-bind('compact ? "5px" : "15px"');
  }
}

@media (max-width: 768px) {
  .radar-chart-container {
    max-width: 100%;
    padding: 10px;
  }
}

@media print {
  .radar-chart-container {
    max-width: 400px;
    break-inside: avoid;
  }
}
</style>

