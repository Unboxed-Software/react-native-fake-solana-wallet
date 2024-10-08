import { Button, StyleSheet, Text, View } from "react-native";
import { useWallet } from "../components/WalletProvider";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "center", // Centers children along the main axis (vertically for column)
    alignItems: "center", // Centers children along the cross axis (horizontally for column)
  },
});

function MainScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<null | number>(null);
  const { wallet, connection } = useWallet();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    updateBalance();
  }, [wallet]);

  const updateBalance = async () => {
    if (wallet) {
      try {
        const lamports = await connection.getBalance(wallet.publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Failed to fetch / update balance:", error);
        setErrorMessage("Failed to fetch balance");

      }
    }
  };

  const airdrop = async () => {
    if (wallet && !isLoading) {
      setIsLoading(true);
      try {
        const signature = await connection.requestAirdrop(
          wallet.publicKey,
          LAMPORTS_PER_SOL,
        );
        await connection.confirmTransaction(signature, "max");
        await updateBalance();
      } catch (error) {
        console.log("error requesting airdrop", error);
        setErrorMessage("Airdrop failed");
      }

      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Wallet:</Text>
      <Text>{wallet?.publicKey.toString() ?? "No Wallet"}</Text>
      <Text>Balance:</Text>
      <Text>{balance?.toFixed(5) ?? ""}</Text>
      {isLoading && <Text>Loading...</Text>}
      {errorMessage && <Text style={{ color: 'red' }}>{errorMessage}</Text>}
      {balance !== null && !isLoading && balance < 0.005 && (
        <Button title="Airdrop 1 SOL" onPress={airdrop} />
      )}
    </View>
  );
}

export default MainScreen;