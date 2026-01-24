import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EventContext } from './types';

interface EventContextType {
    eventContext: EventContext | null;
    setEventContext: (context: EventContext | null) => void;
}

const EventContextReact = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [eventContext, setEventContext] = useState<EventContext | null>(null);

    return (
        <EventContextReact.Provider value={{ eventContext, setEventContext }}>
            {children}
        </EventContextReact.Provider>
    );
};

export const useEventContext = (): EventContextType => {
    const context = useContext(EventContextReact);
    if (!context) {
        throw new Error('useEventContext must be used within an EventProvider');
    }
    return context;
};
