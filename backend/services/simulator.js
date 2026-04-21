/**
 * Sensor Data Simulator
 * 
 * Generates realistic simulated sensor data for development and testing
 * without requiring physical hardware. Includes:
 * - Natural fluctuations with time-of-day patterns
 * - Random anomaly events (gas spikes, dust events, overcrowding)
 * - Gradual trends (CO₂ buildup during "occupied hours")
 */

class SensorSimulator {
  constructor() {
    // Base values for "normal" indoor conditions
    this.baseValues = {
      temperature: 26,    // °C — typical Indian indoor
      humidity: 55,       // %RH
      mq2Raw: 800,        // Analog value (clean air)
      mq2Ppm: 180,        // ppm (clean air for combustible)
      mq135Raw: 500,      // Analog value
      co2Ppm: 450,        // ppm (slightly above outdoor baseline)
      no2Ppm: 0.04,       // ppm (normal indoor)
      nh3Ppm: 5,          // ppm (normal indoor)
      dustVoltage: 0.5,   // Volts
      dustDensity: 15     // µg/m³ (clean indoor)
    };

    // Current simulated values (will drift)
    this.current = { ...this.baseValues };

    // Event state
    this.activeEvent = null;
    this.eventCountdown = 0;
    this.tickCount = 0;
  }

  /**
   * Add Gaussian noise to a value
   */
  noise(value, stdDev) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return value + n * stdDev;
  }

  /**
   * Clamp a value between min and max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Simulate time-of-day effects
   */
  getTimeOfDayFactor() {
    const hour = new Date().getHours();

    // Simulate occupancy pattern: 
    // Low at night (22-6), ramp up (7-9), high during day (9-17), decrease (17-22)
    if (hour >= 9 && hour <= 17) return 1.0;    // Peak hours
    if (hour >= 7 && hour < 9) return 0.5 + (hour - 7) * 0.25;  // Morning ramp
    if (hour > 17 && hour <= 22) return 1.0 - (hour - 17) * 0.15;  // Evening decrease
    return 0.2;  // Night time (building mostly empty)
  }

  /**
   * Maybe trigger a random anomaly event
   */
  maybeStartEvent() {
    if (this.activeEvent || Math.random() > 0.02) return; // 2% chance per tick

    const events = [
      { name: 'cooking', duration: 10, mq2Boost: 800, dustBoost: 40, co2Boost: 200 },
      { name: 'smoking', duration: 8, mq2Boost: 1200, dustBoost: 60, co2Boost: 100 },
      { name: 'cleaning', duration: 6, nh3Boost: 20, vocBoost: 300 },
      { name: 'dust_event', duration: 5, dustBoost: 80 },
      { name: 'overcrowding', duration: 15, co2Boost: 500, humidityBoost: 15, tempBoost: 3 },
      { name: 'gas_leak', duration: 4, mq2Boost: 2500 },
    ];

    this.activeEvent = events[Math.floor(Math.random() * events.length)];
    this.eventCountdown = this.activeEvent.duration;
    console.log(`🎲 Simulator event: ${this.activeEvent.name} (${this.activeEvent.duration} ticks)`);
  }

  /**
   * Generate one simulated sensor reading
   * @returns {Object} Raw sensor data matching ESP32 format
   */
  generateReading() {
    this.tickCount++;
    const todFactor = this.getTimeOfDayFactor();

    // Maybe start a random event
    this.maybeStartEvent();

    // Base + time-of-day drift
    let temp = this.noise(this.baseValues.temperature + todFactor * 2, 0.3);
    let humidity = this.noise(this.baseValues.humidity + todFactor * 8, 1);
    let mq2Ppm = this.noise(this.baseValues.mq2Ppm + todFactor * 50, 10);
    let mq2Raw = this.noise(this.baseValues.mq2Raw + todFactor * 200, 30);
    let co2Ppm = this.noise(this.baseValues.co2Ppm + todFactor * 250, 15);
    let no2Ppm = this.noise(this.baseValues.no2Ppm + todFactor * 0.02, 0.005);
    let nh3Ppm = this.noise(this.baseValues.nh3Ppm + todFactor * 3, 0.5);
    let mq135Raw = this.noise(this.baseValues.mq135Raw + todFactor * 200, 20);
    let dustDensity = this.noise(this.baseValues.dustDensity + todFactor * 10, 2);
    let dustVoltage = this.noise(this.baseValues.dustVoltage + todFactor * 0.3, 0.05);

    // Apply active event boosts
    if (this.activeEvent && this.eventCountdown > 0) {
      const event = this.activeEvent;
      const intensity = Math.sin((1 - this.eventCountdown / event.duration) * Math.PI); // Bell curve

      if (event.mq2Boost) mq2Ppm += event.mq2Boost * intensity;
      if (event.dustBoost) dustDensity += event.dustBoost * intensity;
      if (event.co2Boost) co2Ppm += event.co2Boost * intensity;
      if (event.nh3Boost) nh3Ppm += event.nh3Boost * intensity;
      if (event.vocBoost) mq135Raw += event.vocBoost * intensity;
      if (event.humidityBoost) humidity += event.humidityBoost * intensity;
      if (event.tempBoost) temp += event.tempBoost * intensity;

      this.eventCountdown--;
      if (this.eventCountdown <= 0) {
        console.log(`✅ Simulator event ended: ${this.activeEvent.name}`);
        this.activeEvent = null;
      }
    }

    // Clamp all values to realistic ranges
    temp = this.clamp(Math.round(temp * 10) / 10, 10, 50);
    humidity = this.clamp(Math.round(humidity), 15, 95);
    mq2Ppm = this.clamp(Math.round(mq2Ppm), 50, 10000);
    mq2Raw = this.clamp(Math.round(mq2Raw), 100, 4095);
    co2Ppm = this.clamp(Math.round(co2Ppm), 350, 5000);
    no2Ppm = this.clamp(Math.round(no2Ppm * 1000) / 1000, 0, 2);
    nh3Ppm = this.clamp(Math.round(nh3Ppm * 10) / 10, 0, 300);
    mq135Raw = this.clamp(Math.round(mq135Raw), 100, 4095);
    dustDensity = this.clamp(Math.round(dustDensity * 10) / 10, 0, 500);
    dustVoltage = this.clamp(Math.round(dustVoltage * 100) / 100, 0, 3.3);

    return {
      metadata: {
        sensorId: 'zone-a',
        building: 'main-building',
        floor: 1
      },
      mq2: {
        raw: mq2Raw,
        ppm: mq2Ppm
      },
      mq135: {
        raw: mq135Raw,
        co2_ppm: co2Ppm,
        no2_ppm: no2Ppm,
        nh3_ppm: nh3Ppm
      },
      dust: {
        raw: dustVoltage,
        density: dustDensity
      },
      dht11: {
        temperature: temp,
        humidity: humidity
      }
    };
  }
}

module.exports = SensorSimulator;
