package ph.sagay.tricycleconductreporting;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SosDevice")
public class SosDevicePlugin extends Plugin {
    private static final String PREFS = "sos_secure_store";
    private static final String IDENTITY = "registered_identity";
    private static final String PENDING = "pending_alert";
    private static final String KEY_ALIAS = "tricycle_sos_secure_key_v1";
    private static final int GCM_TAG_BITS = 128;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE);
    }

    private SecretKey encryptionKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) return (SecretKey) store.getKey(KEY_ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build());
        return generator.generateKey();
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, encryptionKey());
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        return Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" + Base64.encodeToString(encrypted, Base64.NO_WRAP);
    }

    private String decrypt(String value) throws Exception {
        String[] parts = value.split(":", 2);
        if (parts.length != 2) throw new IllegalArgumentException("Secure SOS data is unreadable.");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, encryptionKey(), new GCMParameterSpec(GCM_TAG_BITS, Base64.decode(parts[0], Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void saveIdentity(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null || payload.length() > 4000) { call.reject("Registered SOS identity is missing or too large."); return; }
        try {
            new JSONObject(payload);
            prefs().edit().putString(IDENTITY, encrypt(payload)).apply();
            call.resolve(new JSObject().put("saved", true));
        } catch (Exception error) { call.reject("Could not securely store this phone's SOS identity.", error); }
    }

    @PluginMethod
    public void getIdentity(PluginCall call) {
        try {
            String value = prefs().getString(IDENTITY, null);
            if (value == null) { call.resolve(new JSObject().put("identity", JSONObject.NULL)); return; }
            call.resolve(new JSObject().put("identity", new JSONObject(decrypt(value))));
        } catch (Exception error) { call.reject("Could not read the secure SOS registration.", error); }
    }

    @PluginMethod
    public void clearIdentity(PluginCall call) {
        prefs().edit().remove(IDENTITY).remove(PENDING).apply();
        call.resolve(new JSObject().put("cleared", true));
    }

    @PluginMethod
    public void savePendingAlert(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null || payload.length() > 8000) { call.reject("Pending SOS alert is missing or too large."); return; }
        try {
            new JSONObject(payload);
            prefs().edit().putString(PENDING, encrypt(payload)).apply();
            call.resolve(new JSObject().put("saved", true));
        } catch (Exception error) { call.reject("Could not securely save the pending SOS alert.", error); }
    }

    @PluginMethod
    public void getPendingAlert(PluginCall call) {
        try {
            String value = prefs().getString(PENDING, null);
            if (value == null) { call.resolve(new JSObject().put("alert", JSONObject.NULL)); return; }
            call.resolve(new JSObject().put("alert", new JSONObject(decrypt(value))));
        } catch (Exception error) { call.reject("Could not read the pending SOS alert.", error); }
    }

    @PluginMethod
    public void clearPendingAlert(PluginCall call) {
        prefs().edit().remove(PENDING).apply();
        call.resolve(new JSObject().put("cleared", true));
    }

    @PluginMethod
    public void openSmsComposer(PluginCall call) {
        String number = call.getString("number", "").replaceAll("[^+0-9]", "");
        String message = call.getString("message", "");
        if (number.length() < 5 || message.isEmpty() || message.length() > 1200) { call.reject("A valid emergency SMS contact and message are required."); return; }
        try {
            Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.fromParts("smsto", number, null));
            intent.putExtra("sms_body", message);
            getActivity().startActivity(intent);
            call.resolve(new JSObject().put("opened", true));
        } catch (Exception error) { call.reject("No messaging app is available to prepare the SOS text.", error); }
    }

    @PluginMethod
    public void getLaunchAction(PluginCall call) {
        Intent intent = getActivity().getIntent();
        Uri data = intent == null ? null : intent.getData();
        boolean openSos = data != null && "tricycleconductreporting".equals(data.getScheme()) && "sos".equals(data.getHost());
        if (openSos) getActivity().setIntent(new Intent(Intent.ACTION_MAIN));
        call.resolve(new JSObject().put("openSos", openSos));
    }
}
