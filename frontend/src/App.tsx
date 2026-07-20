import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { BuilderPage } from "@/pages/BuilderPage";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/builder" element={<BuilderRoute />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

function BuilderRoute() {
    const location = useLocation();
    const navigate = useNavigate();
    const prompt = (location.state as { prompt?: string } | null)?.prompt;

    if (!prompt) {
        return <Navigate to="/" replace />;
    }

    return <BuilderPage prompt={prompt} onBack={() => navigate("/")} />;
}

export default App;
