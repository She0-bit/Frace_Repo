import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import CasesList from './pages/CasesList';
import CaseDetails from './pages/CaseDetails';
import AuthoritiesView from './pages/AuthoritiesView';
import SystemLogs from './pages/SystemLogs';
import LocationData from './pages/LocationData';
import DataManagement from './pages/DataManagement';
import CrowdRouting from './pages/CrowdRouting';
import PredictiveSpread from './pages/PredictiveSpread';
import UserRiskDashboard from './pages/UserRiskDashboard';
import AISimulation from './pages/AISimulation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NewCase": NewCase,
    "CasesList": CasesList,
    "CaseDetails": CaseDetails,
    "AuthoritiesView": AuthoritiesView,
    "SystemLogs": SystemLogs,
    "LocationData": LocationData,
    "DataManagement": DataManagement,
    "CrowdRouting": CrowdRouting,
    "PredictiveSpread": PredictiveSpread,
    "UserRiskDashboard": UserRiskDashboard,
    "AISimulation": AISimulation,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};