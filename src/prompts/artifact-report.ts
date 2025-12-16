import { GeoAnalysis } from '../types/geo.types.js';

export function createArtifactPrompt(analysis: GeoAnalysis): string {
  const componentTemplates = `
VISUAL STYLE GUIDE COMPONENTS (Define at top of React component):

\`\`\`javascript
const lucide = window.lucide;
const CheckCircle = lucide?.CheckCircle;
const AlertCircle = lucide?.AlertCircle;
const XCircle = lucide?.XCircle;
const TrendingUp = lucide?.TrendingUp;
const TrendingDown = lucide?.TrendingDown;
const FileText = lucide?.FileText;
const List = lucide?.List;
const Hash = lucide?.Hash;
const Calendar = lucide?.Calendar;
const Target = lucide?.Target;
const ChevronDown = lucide?.ChevronDown;
const ChevronUp = lucide?.ChevronUp;

const Card = ({ children, className = '' }) => 
  <div className={\`rounded-lg border border-gray-200 bg-white shadow-sm \${className}\`}>
    {children}
  </div>;

const Badge = ({ children, variant = 'success' }) => {
  const variants = { 
    success: 'bg-green-100 text-green-800 border-green-200', 
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  return <span className={\`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold \${variants[variant]}\`}>{children}</span>;
};

const Progress = ({ value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    green: 'bg-green-500'
  };
  return (
    <div className="relative h-3 w-full rounded-full bg-gray-200">
      <div className={\`h-full rounded-full transition-all \${colors[color]}\`} style={{ width: \`\${value}%\` }} />
    </div>
  );
};

const ScoreCard = ({ title, score, maxScore, icon: Icon, variant }) => {
  const variants = {
    success: 'from-green-50 to-green-100 border-green-200',
    warning: 'from-yellow-50 to-yellow-100 border-yellow-200',
    error: 'from-red-50 to-red-100 border-red-200'
  };
  const textColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };
  return (
    <Card className={\`bg-gradient-to-br \${variants[variant]}\`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">{title}</div>
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        </div>
        <div className={\`text-4xl font-bold \${textColors[variant]} mb-1\`}>
          {score}/{maxScore}
        </div>
      </div>
    </Card>
  );
};
\`\`\`
`;

  return `═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTION - REACT ARTIFACT REQUIRED
═══════════════════════════════════════════════════════════════

YOU MUST CREATE AN INTERACTIVE REACT ARTIFACT FOR THIS ANALYSIS.
DO NOT provide HTML. DO NOT use Tailwind CDN script tags.
IMMEDIATELY create a React artifact using the specifications below.

${componentTemplates}

GEO ANALYSIS DATA:
${JSON.stringify(analysis, null, 2)}

STRUCTURE:
1. **Header Section**
   - Title with gradient background (bg-gradient-to-r from-blue-600 to-purple-600)
   - Analyzed date, version, target query
   - Use FileText icon from Lucide

2. **Score Cards Grid** (grid grid-cols-1 md:grid-cols-4 gap-6)
   - Overall Score: Large, prominent, variant based on score
   - Extractability: ScoreCard with TrendingUp icon
   - Readability: ScoreCard with List icon
   - Citability: ScoreCard with Target icon
   - Color logic: >7 = success, 5-7 = warning, <5 = error

3. **Key Metrics Grid** (grid grid-cols-1 md:grid-cols-2 gap-6)
   - Sentence Length: Progress bar showing average vs target
   - Claim Density: Progress bar with critical indicators
   - Date Markers: Side-by-side comparison (found vs recommended)
   - Structure: Grid of heading count, list count, TOC status

4. **Recommendations Section**
   - HIGH PRIORITY: Red border-l-4, Badge with variant="error"
   - MEDIUM PRIORITY: Yellow border-l-4, Badge with variant="warning"
   - LOW PRIORITY: Green border-l-4, Badge with variant="success"
   - Each recommendation Card shows: method, location, current state, suggested text, rationale

5. **Collapsible Detailed Metrics** (useState for expanded state)
   - Problematic Sentences: Map through analysis.metrics.sentenceLength.problematic
   - Semantic Triples: Show examples with confidence scores
   - Content Chunking: Display chunk analysis with coherence scores
   - Use ChevronDown/ChevronUp icons in collapsible headers

DESIGN SYSTEM:
- Background: bg-gray-50 (light theme)
- Text: text-gray-900
- Cards: bg-white border border-gray-200
- Accent colors:
  * Success/Green: green-100, green-600, green-800
  * Warning/Yellow: yellow-100, yellow-600, yellow-800
  * Error/Red: red-100, red-600, red-800
- Interactive: hover:bg-gray-50 for clickable elements
- Spacing: p-6 for card padding, gap-6 for grids
- Typography: text-4xl for scores, text-2xl for section headers, text-sm for body

INTERACTIVITY:
- useState for collapsible sections (default: all collapsed for better initial view)
- Click handlers on section headers to toggle visibility
- Smooth transitions on expand/collapse
- Hover states on interactive elements

LAYOUT EXAMPLE:
\`\`\`javascript
export default function GeoAnalysisDashboard() {
  const [expandedSections, setExpandedSections] = React.useState({
    problematic: false,
    triples: false,
    chunking: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {/* Score Cards Grid */}
        {/* Key Metrics Grid */}
        {/* Recommendations */}
        {/* Detailed Metrics (Collapsible) */}
      </div>
    </div>
  );
}
\`\`\`

CRITICAL REQUIREMENTS:
✓ React component with hooks (useState)
✓ Lucide icons via window.lucide
✓ Inline component definitions (Card, Badge, Progress, ScoreCard)
✓ NO Tailwind CDN script tags
✓ NO HTML wrapper - pure React
✓ Show ALL data - no truncation or "+N more" placeholders
✓ All problematic sentences displayed
✓ All semantic triple examples shown
✓ All chunking analysis included

REMINDER: This MUST be a React artifact (application/vnd.ant.react), not HTML.
The artifact should be self-contained and immediately functional.

═══════════════════════════════════════════════════════════════
END CRITICAL INSTRUCTION
═══════════════════════════════════════════════════════════════
`;
}
