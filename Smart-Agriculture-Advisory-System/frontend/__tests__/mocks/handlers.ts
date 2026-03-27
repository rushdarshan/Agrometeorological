// __tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

/**
 * Mock API handlers for all backend endpoints.
 * These intercept API calls during tests and return realistic response data.
 */

export const handlers = [
  // ============ AUTH ENDPOINTS ============
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json()
    
    // Simulate validation
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { detail: 'Missing required fields' },
        { status: 422 }
      )
    }
    
    return HttpResponse.json(
      {
        access_token: 'mock_token_' + Math.random().toString(),
        token_type: 'bearer',
        farmer: {
          id: 1,
          email: body.email,
          name: body.name,
        },
      },
      { status: 201 }
    )
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { detail: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({
      access_token: 'mock_token_' + Math.random().toString(),
      token_type: 'bearer',
      farmer: {
        id: 1,
        email: body.email,
      },
    })
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'mock_token_' + Math.random().toString(),
      token_type: 'bearer',
    })
  }),

  // ============ FARM ENDPOINTS ============
  http.get('/api/farms', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Green Valley Farm',
        location: '6.5244,3.3792',
        size_hectares: 5.5,
        soil_type: 'loam',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Sunny Ridge Farm',
        location: '6.5350,3.3850',
        size_hectares: 8.0,
        soil_type: 'sandy loam',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ])
  }),

  http.get('/api/farms/:farmId', ({ params }) => {
    const { farmId } = params
    
    if (farmId === '99999') {
      return HttpResponse.json(
        { detail: 'Farm not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      id: parseInt(farmId as string),
      name: 'Green Valley Farm',
      location: '6.5244,3.3792',
      size_hectares: 5.5,
      soil_type: 'loam',
      crops: ['maize', 'cassava'],
      is_active: true,
      created_at: new Date().toISOString(),
    })
  }),

  http.post('/api/farms', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json(
      {
        id: Math.floor(Math.random() * 1000),
        ...body,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // ============ ADVISORY ENDPOINTS ============
  http.get('/api/advisories', () => {
    return HttpResponse.json([
      {
        id: 1,
        farm_id: 1,
        advisory_type: 'irrigation',
        title: 'Irrigation Advisory for Maize',
        description: 'Based on current soil moisture and weather forecast',
        recommendation: 'Irrigate for 3 hours',
        confidence: 'high',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        farm_id: 1,
        advisory_type: 'fertilization',
        title: 'Fertilization Recommendation',
        description: 'Crop is at vegetative stage',
        recommendation: 'Apply NPK 15:15:15',
        confidence: 'medium',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ])
  }),

  http.get('/api/advisories/:advisoryId', ({ params }) => {
    const { advisoryId } = params
    
    if (advisoryId === '99999') {
      return HttpResponse.json(
        { detail: 'Advisory not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      id: parseInt(advisoryId as string),
      farm_id: 1,
      advisory_type: 'irrigation',
      title: 'Irrigation Advisory for Maize',
      description: 'Based on current soil moisture and weather forecast',
      recommendation: 'Irrigate for 3 hours',
      confidence: 'high',
      data: {
        soil_moisture: 45.2,
        rainfall_forecast: 5.2,
        days_to_maturity: 45,
      },
      created_at: new Date().toISOString(),
    })
  }),

  http.post('/api/advisories/generate', async ({ request }) => {
    const body = await request.json()
    
    if (!body.farm_id) {
      return HttpResponse.json(
        { detail: 'farm_id is required' },
        { status: 422 }
      )
    }
    
    return HttpResponse.json(
      {
        id: Math.floor(Math.random() * 10000),
        farm_id: body.farm_id,
        advisory_type: 'irrigation',
        title: 'Generated Advisory',
        recommendation: 'Recommended action based on ML model',
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  http.patch('/api/advisories/:advisoryId', async ({ request, params }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      id: parseInt(params.advisoryId as string),
      status: body.status,
      updated_at: new Date().toISOString(),
    })
  }),

  // ============ DASHBOARD ENDPOINTS ============
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json({
      total_farms: 12,
      total_crops: 25,
      total_advisories: 47,
      total_alerts: 3,
      pending_actions: 5,
      successful_predictions: 38,
      avg_farm_health: 78.5,
    })
  }),

  http.get('/api/dashboard/regional', () => {
    return HttpResponse.json({
      states: [
        {
          name: 'Lagos',
          farms: 25,
          advisories: 103,
          avg_success_rate: 85.5,
        },
        {
          name: 'Ogun',
          farms: 18,
          advisories: 76,
          avg_success_rate: 82.0,
        },
      ],
    })
  }),

  // ============ WEATHER ENDPOINTS ============
  http.get('/api/weather/:farmId', ({ params }) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    
    return HttpResponse.json({
      location: '6.5244,3.3792',
      forecast: [
        {
          date: tomorrow.toISOString().split('T')[0],
          temp_min: 22,
          temp_max: 28,
          humidity: 75,
          rainfall: 5.2,
          wind_speed: 12,
          cloud_cover: 60,
          pressure: 1013,
        },
        {
          date: dayAfter.toISOString().split('T')[0],
          temp_min: 21,
          temp_max: 27,
          humidity: 78,
          rainfall: 8.5,
          wind_speed: 14,
          cloud_cover: 80,
          pressure: 1011,
        },
      ],
    })
  }),

  // ============ FEEDBACK ENDPOINTS ============
  http.post('/api/feedback', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json(
      {
        id: Math.floor(Math.random() * 10000),
        advisory_id: body.advisory_id,
        feedback_type: body.feedback_type,
        rating: body.rating,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  http.get('/api/feedback', () => {
    return HttpResponse.json([
      {
        id: 1,
        advisory_id: 1,
        feedback_type: 'helpful',
        comment: 'Very helpful advice',
        rating: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        advisory_id: 2,
        feedback_type: 'neutral',
        comment: 'Could be more specific',
        rating: 3,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ])
  }),

  http.get('/api/feedback/summary', () => {
    return HttpResponse.json({
      helpful: 34,
      not_helpful: 8,
      neutral: 12,
      avg_rating: 4.2,
      total_feedbacks: 54,
    })
  }),

  // ============ SMS ENDPOINTS ============
  http.post('/api/sms/send', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json(
      {
        task_id: 'task_' + Math.random().toString(36).substr(2, 9),
        phone_number: body.phone_number,
        status: 'queued',
        message: 'SMS task queued for delivery',
      },
      { status: 202 }
    )
  }),

  http.get('/api/sms/status/:taskId', ({ params }) => {
    return HttpResponse.json({
      task_id: params.taskId,
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
  }),

  http.get('/api/sms/history', () => {
    return HttpResponse.json([
      {
        id: 1,
        phone_number: '+234801234567',
        message: 'Your advisory is ready',
        status: 'delivered',
        sent_at: new Date().toISOString(),
      },
      {
        id: 2,
        phone_number: '+234802345678',
        message: 'Weather update for your region',
        status: 'delivered',
        sent_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ])
  }),

  // ============ ML MODEL ENDPOINTS ============
  http.get('/api/model/feature-importance', () => {
    return HttpResponse.json([
      {
        feature: 'soil_moisture',
        importance: 0.35,
      },
      {
        feature: 'temperature',
        importance: 0.28,
      },
      {
        feature: 'humidity',
        importance: 0.22,
      },
      {
        feature: 'rainfall_forecast',
        importance: 0.15,
      },
    ])
  }),

  http.post('/api/model/predict', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      prediction: 'irrigation',
      confidence: 0.92,
      features_used: body.features,
    })
  }),

  http.get('/api/model/metrics', () => {
    return HttpResponse.json({
      accuracy: 0.87,
      precision: 0.89,
      recall: 0.85,
      f1_score: 0.87,
      auc: 0.91,
    })
  }),

  // ============ HEALTH CHECK ============
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      model_loaded: true,
    })
  }),
]
