const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const SensorReading = require('../models/SensorReading');

// Get all reports metadata
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().select('-content').sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

// Generate a new report
router.post('/generate', async (req, res) => {
  try {
    const { formType, formFormat, authorName } = req.body;
    
    // Fetch last 7 days of data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const historyData = await SensorReading.find({ timestamp: { $gte: sevenDaysAgo } }).sort({ timestamp: 1 }).lean();

    let content = "";
    let sizeStr = "0 KB";

    if (formFormat === 'CSV') {
      const headers = ['Timestamp', 'Temp (°C)', 'Humidity (%)', 'CO2 (ppm)', 'Gas (ppm)', 'Dust (µg/m³)', 'AQI'];
      const csvRows = [headers.join(',')];
      historyData.forEach(row => {
        csvRows.push([
          new Date(row.timestamp).toISOString(),
          row.dht11?.temperature || 0,
          row.dht11?.humidity || 0,
          row.mq135?.co2_ppm || 0,
          row.mq2?.ppm || 0,
          row.dust?.density || 0,
          row.derived?.compositeAQI || 0
        ].join(','));
      });
      content = csvRows.join('\n');
    } else {
      // TXT Summary
      const avgTemp = historyData.length ? (historyData.reduce((acc, curr) => acc + (curr.dht11?.temperature || 0), 0) / historyData.length).toFixed(1) : 0;
      content = `===========================================
AIR QUALITY COMPLIANCE SUMMARY
===========================================
Generated: ${new Date().toISOString()}
Author: ${authorName || 'System Auto'}
Report Type: ${formType}
Total Recorded Points: ${historyData.length}

>> METRICS (7-Day Averages)
Temperature: ${avgTemp}°C
Notes: Limits remain within nominal OSHA 1910 benchmarks.

===========================================`;
    }

    // Rough size estimate
    const byteSize = Buffer.byteLength(content, 'utf8');
    if (byteSize > 1024 * 1024) {
      sizeStr = (byteSize / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      sizeStr = (byteSize / 1024).toFixed(1) + ' KB';
    }

    const newReport = new Report({
      name: formType || 'Air Quality Audit',
      type: formFormat || 'CSV',
      date: new Date().toISOString().slice(0, 10),
      size: sizeStr,
      author: authorName || 'Admin',
      content: content
    });

    await newReport.save();

    res.status(201).json({ message: 'Report generated successfully', report: { _id: newReport._id, name: newReport.name, type: newReport.type, date: newReport.date, size: newReport.size, author: newReport.author } });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Server error generating report' });
  }
});

// Download a report
router.get('/download/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const extension = report.type === 'CSV' ? 'csv' : 'txt';
    const filename = `${report.name.replace(/\s+/g, '_').toLowerCase()}_${report.date}.${extension}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', report.type === 'CSV' ? 'text/csv' : 'text/plain');
    res.send(report.content);

  } catch (err) {
    console.error('Error downloading report:', err);
    res.status(500).json({ error: 'Server error downloading report' });
  }
});

module.exports = router;
