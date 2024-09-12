import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WalletProvider } from "./components/WalletProvider";
import {
  AuthorizeDappRequest,
  MWARequest,
  MWARequestFailReason,
  MWARequestType,
  MWASessionEvent,
  MWASessionEventType,
  MobileWalletAdapterConfig,
  ReauthorizeDappCompleteResponse,
  ReauthorizeDappResponse,
  SignAndSendTransactionsRequest,
  getCallingPackage,
  resolve,
  useMobileWalletAdapterSession,
} from "./lib/mobile-wallet-adapter-walletlib/src";

const styles = StyleSheet.create({
  container: {
    margin: 0,
    width: "100%",
    backgroundColor: "black",
    color: "black",
  },
});

function MWAApp() {
  const [currentRequest, setCurrentRequest] = useState<MWARequest | null>(null);
  const [currentSession, setCurrentSession] = useState<MWASessionEvent | null>(
    null,
  );
  // ------------------- FUNCTIONS --------------------

  const endWalletSession = useCallback(() => {
    setTimeout(() => {
      BackHandler.exitApp();
    }, 200);
  }, []);

  const handleRequest = useCallback((request: MWARequest) => {
    setCurrentRequest(request);
  }, []);

  const handleSessionEvent = useCallback((sessionEvent: MWASessionEvent) => {
    setCurrentSession(sessionEvent);
  }, []);

  // ------------------- EFFECTS --------------------

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
    resolve(currentRequest as any, {
      failReason: MWARequestFailReason.UserDeclined,
    });
    return true; // Prevents default back button behavior
  });
  return () => backHandler.remove();
  }, [currentRequest]);

  useEffect(() => {
    if (currentSession?.__type === MWASessionEventType.SessionTerminatedEvent) {
      endWalletSession();
    }
  }, [currentSession]);

  useEffect(() => {
    if (!currentRequest) {
      return;
    }

    if (currentRequest.__type === MWARequestType.ReauthorizeDappRequest) {
      resolve(currentRequest, {
        authorizationScope: new TextEncoder().encode("app"),
      });
    }
  }, [currentRequest, endWalletSession]);

  // ------------------- MWA --------------------

  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, "legacy"],
      noConnectionWarningTimeoutMs: 3000,
    };
  }, []);

  useMobileWalletAdapterSession(
    "React Native Fake Wallet",
    config,
    handleRequest,
    handleSessionEvent,
  );

  // ------------------- RENDER --------------------

  switch (currentRequest?.__type) {
    case MWARequestType.AuthorizeDappRequest:
      return (
        <AuthorizeDappRequestScreen
          request={currentRequest as AuthorizeDappRequest}
        />
      );
    case MWARequestType.SignAndSendTransactionsRequest:
      return (
        <SignAndSendTransactionScreen
          request={currentRequest as SignAndSendTransactionsRequest}
        />
      );
    case MWARequestType.SignMessagesRequest:
    case MWARequestType.SignTransactionsRequest:
    default:
      return <Text>TODO Show screen for {currentRequest?.__type}</Text>;
  }

  // ------------------- RENDER --------------------

  return (
    <SafeAreaView>
      <WalletProvider>
        <View style={styles.container}>
          <Text>REQUEST: {currentRequest?.__type.toString()}</Text>
          {renderRequest()}
        </View>
      </WalletProvider>
    </SafeAreaView>
  );
}

export default MWAApp;