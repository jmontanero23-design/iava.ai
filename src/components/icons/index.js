/**
 * iAVA Icon System - Elite 2025 Edition
 *
 * Central icon mapping using Lucide React icons.
 * All icons are exported with semantic names for easy use throughout the app.
 *
 * Usage:
 *   import { ChartIcon, AIIcon, PortfolioIcon } from '@/components/icons'
 *   <ChartIcon className="w-5 h-5 text-cyan-400" />
 */

// Navigation Icons
export {
  LineChart as ChartIcon,
  Brain as AIIcon,
  Search as ScannerIcon,
  Briefcase as PortfolioIcon,
  Sparkles as AVAMindIcon,
  MessageSquare as ChatIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Home as HomeIcon,
  LayoutDashboard as DashboardIcon,
} from 'lucide-react'

// Trading / Market Icons
export {
  TrendingUp as BullishIcon,
  TrendingDown as BearishIcon,
  ArrowUpRight as GainIcon,
  ArrowDownRight as LossIcon,
  Activity as ActivityIcon,
  BarChart3 as BarChartIcon,
  CandlestickChart as CandlestickIcon,
  DollarSign as DollarIcon,
  Wallet as WalletIcon,
  PiggyBank as PiggyBankIcon,
  CircleDollarSign as CurrencyIcon,
  Scale as ScaleIcon,
  Gauge as GaugeIcon,
  Target as TargetIcon,
  Crosshair as CrosshairIcon,
} from 'lucide-react'

// Status / Feedback Icons
export {
  AlertTriangle as WarningIcon,
  AlertCircle as AlertIcon,
  CheckCircle as SuccessIcon,
  CheckCircle2 as CheckIcon,
  XCircle as ErrorIcon,
  Info as InfoIcon,
  HelpCircle as HelpIcon,
  Clock as ClockIcon,
  Timer as TimerIcon,
  Loader2 as LoaderIcon,
  RefreshCw as RefreshIcon,
} from 'lucide-react'

// Action Icons
export {
  Zap as ExecuteIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as StopIcon,
  Send as SendIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ExternalLink as ExternalLinkIcon,
  Link as LinkIcon,
  Share2 as ShareIcon,
} from 'lucide-react'

// AI / Intelligence Icons
export {
  Bot as BotIcon,
  Cpu as CpuIcon,
  Wand2 as WandIcon,
  Lightbulb as IdeaIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Scan as ScanIcon,
  Radar as RadarIcon,
  Signal as SignalIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from 'lucide-react'

// Communication Icons
export {
  Bell as BellIcon,
  BellRing as BellRingIcon,
  BellOff as BellOffIcon,
  Volume2 as VolumeIcon,
  VolumeX as MuteIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Phone as PhoneIcon,
} from 'lucide-react'

// User / Auth Icons
export {
  User as UserIcon,
  Users as UsersIcon,
  UserCircle as UserCircleIcon,
  LogIn as LoginIcon,
  LogOut as LogoutIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
} from 'lucide-react'

// Data / Analysis Icons
export {
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Flame as FlameIcon,
  Rocket as RocketIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Crown as CrownIcon,
} from 'lucide-react'

// Time / Calendar Icons
export {
  Calendar as CalendarIcon,
  CalendarDays as CalendarDaysIcon,
  History as HistoryIcon,
  Hourglass as HourglassIcon,
  AlarmClock as AlarmIcon,
} from 'lucide-react'

// File / Document Icons
export {
  FileText as FileTextIcon,
  File as FileIcon,
  Folder as FolderIcon,
  BookOpen as BookIcon,
  Newspaper as NewsIcon,
  FileJson as JsonIcon,
} from 'lucide-react'

// Layout / UI Icons
export {
  Maximize2 as MaximizeIcon,
  Minimize2 as MinimizeIcon,
  Expand as ExpandIcon,
  Shrink as ShrinkIcon,
  PanelLeftClose as PanelCloseIcon,
  PanelLeftOpen as PanelOpenIcon,
  Grid3X3 as GridIcon,
  List as ListIcon,
  Layers as LayersIcon,
  SlidersHorizontal as SlidersIcon,
  Filter as FilterIcon,
  SortAsc as SortAscIcon,
  SortDesc as SortDescIcon,
} from 'lucide-react'

// Misc Icons
export {
  Circle as CircleIcon,
  CircleDot as CircleDotIcon,
  MoreHorizontal as MoreIcon,
  MoreVertical as MoreVerticalIcon,
  Grip as GripIcon,
  Hash as HashIcon,
  AtSign as AtIcon,
  Tag as TagIcon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  Pin as PinIcon,
  MapPin as MapPinIcon,
  Globe as GlobeIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Thermometer as ThermometerIcon,
  Percent as PercentIcon,
} from 'lucide-react'

// Default icon size classes for consistency
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
}

// Common icon color classes
export const iconColors = {
  default: 'text-slate-400',
  primary: 'text-indigo-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-rose-400',
  bullish: 'text-emerald-400',
  bearish: 'text-rose-400',
  neutral: 'text-slate-400',
  muted: 'text-slate-500',
}
