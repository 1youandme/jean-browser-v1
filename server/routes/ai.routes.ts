import { Router } from 'express';
import { aiService } from '../services/ai.service';
import { upload } from '../middleware/upload.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Chat completion endpoint
router.post('/chat', async (req, res) => {
  try {
    const { userId, messages, model, max_tokens, temperature, stream } = req.body;
    
    if (!userId || !messages) {
      return res.status(400).json({ 
        error: 'userId and messages are required' 
      });
    }

    const response = await aiService.chatCompletion(userId, {
      messages,
      model,
      max_tokens,
      temperature,
      stream
    });

    res.json(response);
  } catch (error) {
    logger.error('Chat completion error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Text analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { userId, text, type } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ 
        error: 'userId and text are required' 
      });
    }

    const response = await aiService.analyzeText(userId, {
      text,
      type: type || 'general'
    });

    res.json(response);
  } catch (error) {
    logger.error('Text analysis error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Translation endpoint
router.post('/translate', async (req, res) => {
  try {
    const { userId, text, target_language } = req.body;
    
    if (!userId || !text || !target_language) {
      return res.status(400).json({ 
        error: 'userId, text, and target_language are required' 
      });
    }

    const response = await aiService.translateText(userId, {
      text,
      target_language
    });

    res.json(response);
  } catch (error) {
    logger.error('Translation error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Image generation endpoint
router.post('/image', async (req, res) => {
  try {
    const { userId, prompt, ...options } = req.body;
    
    if (!userId || !prompt) {
      return res.status(400).json({ 
        error: 'userId and prompt are required' 
      });
    }

    const response = await aiService.generateImage(userId, prompt, options);
    res.json(response);
  } catch (error) {
    logger.error('Image generation error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Video generation endpoint
router.post('/video', async (req, res) => {
  try {
    const { userId, prompt, ...options } = req.body;
    
    if (!userId || !prompt) {
      return res.status(400).json({ 
        error: 'userId and prompt are required' 
      });
    }

    const response = await aiService.generateVideo(userId, prompt, options);
    res.json(response);
  } catch (error) {
    logger.error('Video generation error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Audio transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const { userId, language } = req.body;
    
    if (!userId || !req.file) {
      return res.status(400).json({ 
        error: 'userId and audio file are required' 
      });
    }

    const audioBuffer = req.file.buffer;
    const response = await aiService.transcribeAudio(userId, audioBuffer, language);
    
    res.json(response);
  } catch (error) {
    logger.error('Audio transcription error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Speech generation endpoint
router.post('/speech', async (req, res) => {
  try {
    const { userId, text, voice } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ 
        error: 'userId and text are required' 
      });
    }

    const audioBuffer = await aiService.generateSpeech(userId, text, voice);
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="speech.wav"',
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);
  } catch (error) {
    logger.error('Speech generation error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Lip sync endpoint
router.post('/lipsync', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!userId || !files.video || !files.audio) {
      return res.status(400).json({ 
        error: 'userId, video file, and audio file are required' 
      });
    }

    const videoBuffer = files.video[0].buffer;
    const audioBuffer = files.audio[0].buffer;
    
    const resultBuffer = await aiService.generateLipSync(userId, videoBuffer, audioBuffer);
    
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="lipsync.mp4"',
      'Content-Length': resultBuffer.length
    });
    
    res.send(resultBuffer);
  } catch (error) {
    logger.error('Lip sync error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Service health endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await aiService.getServiceHealth();
    res.json(health);
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Available models endpoint
router.get('/models', async (req, res) => {
  try {
    const models = await aiService.getAvailableModels();
    res.json(models);
  } catch (error) {
    logger.error('Get models error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Clear cache endpoint
router.post('/clear-cache', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required' 
      });
    }

    await aiService.clearUserCache(userId);
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Clear cache error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;