import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

if (Platform.OS === 'web') {
    enableScreens(false);

    // Patch removeChild to suppress React 19 DOM errors
    if (typeof window !== 'undefined') {
        const originalRemoveChild = Element.prototype.removeChild;
        Element.prototype.removeChild = function <T extends Node>(child: T): T {
            if (child.parentNode === this) {
                return originalRemoveChild.call(this, child) as T;
            }
            // Silently ignore if not a child
            return child;
        };
    }

    // Suppress console errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
        const msg = args[0]?.toString() || '';
        if (
            msg.includes('removeChild') ||
            msg.includes('not a child') ||
            msg.includes('validateDOMNesting') ||
            msg.includes('NotFoundError')
        ) {
            return;
        }
        originalError.apply(console, args);
    };
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';
import { initParticipantDB } from './services/sqlite';

// Error Boundary
interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Only log non-DOM errors
        if (!error.message?.includes('removeChild')) {
            console.error('Caught error:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                    <Text style={{ color: '#FFD700', fontSize: 18 }}>Something went wrong</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

function App() {
    React.useEffect(() => {
        initParticipantDB();
    }, []);

    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={styles.container}>
                <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                </NavigationContainer>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});

export default App;

registerRootComponent(App);