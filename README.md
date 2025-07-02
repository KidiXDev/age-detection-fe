# 🤖 AI Age Detector

A modern web application for detecting age from photos using artificial intelligence and machine learning. Built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

- **Drag & Drop Upload**: Easy image upload with drag and drop functionality
- **Real-time Processing**: Instant age detection using AI models
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Dark Mode Support**: Automatic dark/light theme switching
- **Error Handling**: Comprehensive error handling and user feedback
- **TypeScript**: Full type safety and better developer experience
- **Modern UI**: Beautiful, accessible interface with smooth animations

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **AI Integration**: Python backend API (Flask/FastAPI)
- **Image Processing**: Client-side image handling with File API
- **Deployment**: Vercel-ready configuration

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Python backend API running (for age detection)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd age-detector
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # For development with dummy data (recommended for initial setup)
   USE_DUMMY_DATA=true
   PYTHON_API_URL=http://localhost:5000/api/detect-age
   
   # When Python backend is ready, set:
   # USE_DUMMY_DATA=false
   # PYTHON_API_URL=your-actual-python-api-url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Development Mode with Dummy Data

The application includes a **dummy data mode** for development and testing purposes when the Python backend is not yet available:

### Features of Dummy Mode:
- ✅ **Realistic Results**: Generates consistent age predictions based on filename
- ✅ **Simulated Processing**: Includes realistic API delay (1.5-2.5 seconds)
- ✅ **Full Feature Testing**: Tests all UI components and error handling
- ✅ **Visual Indicators**: Clear "DEMO MODE" badges to distinguish from real results
- ✅ **Easy Toggle**: Simple environment variable to switch modes

### Switching Between Modes:

**Development Mode (Dummy Data):**
```env
USE_DUMMY_DATA=true
```

**Production Mode (Real API):**
```env
USE_DUMMY_DATA=false
PYTHON_API_URL=http://your-python-backend:5000/api/detect-age
```

### Dummy Data Characteristics:
- Ages: Random between 18-65 years
- Confidence: 60-98% realistic range
- Gender: Male/Female with consistent results per image
- Messages: Varied realistic AI responses

## 🔧 Configuration

### Python Backend API

The frontend expects a Python backend API with the following endpoint:

```
POST /api/detect-age
Content-Type: multipart/form-data

Request Body:
- image: File (JPG, PNG, WebP)

Response:
{
  "age": number,
  "confidence": number,
  "gender": string (optional),
  "message": string (optional)
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PYTHON_API_URL` | URL of the Python backend API | `http://localhost:5000/api/detect-age` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `AI Age Detector` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0` |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── detect-age/
│   │       └── route.ts          # API route for backend integration
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── AgeDetector.tsx          # Main age detection component
│   └── LoadingSpinner.tsx       # Loading component
└── types/                       # TypeScript type definitions
```

## 🎯 API Integration

The application integrates with a Python backend through the `/api/detect-age` route. The frontend:

1. Validates uploaded images (type, size)
2. Forwards requests to the Python backend
3. Handles responses and errors
4. Displays results to the user

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app is compatible with any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS Amplify

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## 📱 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- The AI/ML community for age detection models
- Contributors and testers

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

**Happy coding! 🚀**
