import { StyleSheet } from "react-native";
import { colors } from "../../styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary, // verde no topo
  },
  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    textAlign: "center",
    color: colors.white,
    fontSize: 20,
    fontWeight: "600",
  },
  logoBold: {
    fontWeight: "bold",
    fontSize: 26,
  },
  subTitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  formContainer: {
    flex: 2,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 5,
    color: colors.black,
  },
  link: {
    marginTop: 10,
    textAlign: "center",
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 30,
    padding: 12,
    marginTop: 15,
    alignItems: "center",
  },
  googleText: {
    fontSize: 16,
    color: colors.black,
  },
});
