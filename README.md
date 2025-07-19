
# ResumeX - AI-Powered Resume Generator

Transform your old resume into a modern, professional design using AI technology.

## Features

- **AI-Powered Parsing**: Upload PDF or DOCX resumes and extract data automatically
- **Multiple Templates**: Choose from free and premium templates
- **Live Preview**: See your resume in real-time as you edit
- **PDF Generation**: Download print-ready A4 PDFs
- **Payment Integration**: Unlock premium templates with Razorpay
- **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind), Vanilla JavaScript
- **Backend**: Node.js, Express
- **AI Integration**: OpenAI API / HuggingFace API
- **PDF Processing**: pdf-parse, mammoth
- **PDF Generation**: Puppeteer
- **Payments**: Razorpay
- **Deployment**: Replit / Vercel

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## API Endpoints

- `POST /api/upload` - Upload resume file
- `POST /api/parse` - Parse uploaded resume with AI
- `POST /api/pdf/generate` - Generate PDF from resume data
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

## Folder Structure

```
resumex/
├── client/           # Frontend files
├── server/           # Express server
│   └── api/         # API routes
├── templates/        # Resume templates
├── uploads/          # Temporary uploads
├── .env.example     # Environment variables template
└── vercel.json      # Deployment config
```

## Templates

- **Modern** (Free): Clean, professional design
- **Executive** (Premium): Formal, executive-level layout
- **Creative** (Premium): Colorful, creative design

## Deployment

The app is configured for automatic deployment on:
- **Replit**: Use the Run button
- **Vercel**: Push to GitHub and connect

## License

MIT License - see LICENSE file for details.
