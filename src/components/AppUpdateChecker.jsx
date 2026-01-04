import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } from '@capawesome/capacitor-app-update';
import { isMobileAPK } from '../utils/mobile';
import { Download, RefreshCw } from 'lucide-react';

/**
 * AppUpdateChecker - Google Play In-App Updates Component
 * Shows a modal when a new version is available in the Play Store
 */
export const AppUpdateChecker = ({ language = 'en' }) => {
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isReadyToInstall, setIsReadyToInstall] = useState(false);

    // Storage key for tracking when user dismissed the update
    const DISMISS_KEY = 'app_update_dismissed_at';
    const COOLDOWN_HOURS = 24; // Don't show again for 24 hours after dismissing

    const translations = {
        en: {
            updateAvailable: 'Update Available',
            updateMessage: 'A new version of the app is available. Update now for the best experience with new features and improvements.',
            updateNow: 'Update Now',
            later: 'Later',
            downloading: 'Downloading update...',
            readyToInstall: 'Update ready to install',
            restart: 'Restart',
        },
        hi: {
            updateAvailable: 'अपडेट उपलब्ध है',
            updateMessage: 'ऐप का नया संस्करण उपलब्ध है। नई सुविधाओं और सुधारों के लिए अभी अपडेट करें।',
            updateNow: 'अभी अपडेट करें',
            later: 'बाद में',
            downloading: 'अपडेट डाउनलोड हो रहा है...',
            readyToInstall: 'अपडेट इंस्टॉल के लिए तैयार',
            restart: 'पुनः आरंभ करें',
        },
    };

    const t = translations[language] || translations.en;

    useEffect(() => {
        // Only check for updates on Android APK
        if (!isMobileAPK()) {
            return;
        }

        checkForUpdates();

        // Listen for flexible update download progress
        const listener = AppUpdate.addListener('onFlexibleUpdateStateChange', (state) => {
            if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADING) {
                setIsDownloading(true);
                if (state.bytesDownloaded !== undefined && state.totalBytesToDownload !== undefined && state.totalBytesToDownload > 0) {
                    const progress = Math.round((state.bytesDownloaded / state.totalBytesToDownload) * 100);
                    setDownloadProgress(progress);
                }
            } else if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
                setIsDownloading(false);
                setIsReadyToInstall(true);
            } else if (state.installStatus === FlexibleUpdateInstallStatus.INSTALLED) {
                setShowUpdateModal(false);
                setIsReadyToInstall(false);
            }
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, []);

    const shouldShowUpdatePrompt = () => {
        try {
            const dismissedAt = localStorage.getItem(DISMISS_KEY);
            if (!dismissedAt) return true;

            const dismissedTime = parseInt(dismissedAt, 10);
            const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);

            return hoursSinceDismiss >= COOLDOWN_HOURS;
        } catch {
            return true;
        }
    };

    const checkForUpdates = async () => {
        try {
            if (!shouldShowUpdatePrompt()) {
                console.log('Update check skipped - user dismissed within last 24 hours');
                return;
            }

            const info = await AppUpdate.getAppUpdateInfo();

            if (info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
                setUpdateInfo({
                    currentVersion: info.currentVersionCode?.toString() || 'Unknown',
                    availableVersion: info.availableVersionCode?.toString() || 'Unknown',
                });
                setShowUpdateModal(true);
            }
        } catch (error) {
            console.error('Failed to check for app updates:', error);
        }
    };

    const handleImmediateUpdate = async () => {
        try {
            await AppUpdate.performImmediateUpdate();
        } catch (error) {
            console.error('Failed to perform immediate update:', error);
            handleOpenStore();
        }
    };

    const handleCompleteUpdate = async () => {
        try {
            await AppUpdate.completeFlexibleUpdate();
        } catch (error) {
            console.error('Failed to complete update:', error);
        }
    };

    const handleOpenStore = async () => {
        try {
            await AppUpdate.openAppStore();
        } catch (error) {
            console.error('Failed to open app store:', error);
        }
    };

    const handleDismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        } catch {
            // Ignore storage errors
        }
        setShowUpdateModal(false);
    };

    if (!showUpdateModal) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Download className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{t.updateAvailable}</h2>
                    {updateInfo && (
                        <p className="text-white/80 text-sm mt-1">
                            v{updateInfo.currentVersion} → v{updateInfo.availableVersion}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {isDownloading ? (
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 text-saffron-500 animate-spin mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{t.downloading}</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-saffron-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{downloadProgress}%</p>
                        </div>
                    ) : isReadyToInstall ? (
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{t.readyToInstall}</p>
                            <button
                                onClick={handleCompleteUpdate}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                {t.restart}
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                                {t.updateMessage}
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleImmediateUpdate}
                                    className="w-full py-3 bg-saffron-600 text-white rounded-xl font-medium hover:bg-saffron-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    {t.updateNow}
                                </button>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t.later}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AppUpdateChecker;
