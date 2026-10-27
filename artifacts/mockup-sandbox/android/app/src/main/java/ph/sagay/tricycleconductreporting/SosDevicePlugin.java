package ph.sagay.tricycleconductreporting;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.telephony.SmsManager;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SosDevice", permissions = {
    @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS })
})
public class SosDevicePlugin extends Plugin {
    private static final String PREFS = "sos_secure_store";
    private static final String IDENTITY = "registered_identity";
    private static final String PENDING = "pending_alert";
    private static final String KEY_ALIAS = "tricycle_sos_secure_key_v1";
    private static final int GCM_TAG_BITS = 128;
    private static final long SMS_SEND_TIMEOUT_MS = 90000L;

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
    public void checkSmsPermission(PluginCall call) {
        boolean granted = getPermissionState("sms") == PermissionState.GRANTED;
        call.resolve(new JSObject().put("granted", granted));
    }

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            call.resolve(new JSObject().put("granted", true));
            return;
        }
        requestPermissionForAlias("sms", call, "smsPermissionResult");
    }

    @PermissionCallback
    private void smsPermissionResult(PluginCall call) {
        boolean granted = getPermissionState("sms") == PermissionState.GRANTED;
        call.resolve(new JSObject().put("granted", granted));
    }

    @PluginMethod
    public void sendSmsDirectly(PluginCall call) {
        String number = call.getString("number", "").replaceAll("[^+0-9]", "");
        String message = call.getString("message", "");
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("Direct SMS permission is unavailable. Open the prepared SMS and send it manually.");
            return;
        }
        if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY_MESSAGING)) {
            call.reject("This phone cannot send SMS messages.");
            return;
        }
        if (number.length() < 5 || message.isEmpty() || message.length() > 1200) {
            call.reject("A valid emergency SMS contact and message are required.");
            return;
        }

        final String action = getContext().getPackageName() + ".SOS_SMS_SENT." + UUID.randomUUID();
        final ArrayList<String> parts;
        final SmsManager manager;
        try {
            manager = getContext().getSystemService(SmsManager.class);
            if (manager == null) { call.reject("The phone's SMS service is unavailable."); return; }
            parts = manager.divideMessage(message);
        } catch (Exception error) {
            call.reject("Could not prepare the emergency SMS.", error);
            return;
        }

        call.setKeepAlive(true);
        AtomicInteger remaining = new AtomicInteger(parts.size());
        AtomicBoolean failed = new AtomicBoolean(false);
        AtomicBoolean finished = new AtomicBoolean(false);
        Context context = getContext();
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context receiverContext, Intent intent) {
                if (getResultCode() != Activity.RESULT_OK) failed.set(true);
                if (remaining.decrementAndGet() == 0 && finished.compareAndSet(false, true)) {
                    try { context.unregisterReceiver(this); } catch (Exception ignored) { }
                    if (failed.get()) call.reject("The phone could not send the full SOS text. Use Open SMS again to retry.");
                    else call.resolve(new JSObject().put("sent", true));
                }
            }
        };

        IntentFilter filter = new IntentFilter(action);
        if (Build.VERSION.SDK_INT >= 33) context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        else context.registerReceiver(receiver, filter);

        ArrayList<PendingIntent> sentIntents = new ArrayList<>();
        for (int index = 0; index < parts.size(); index++) {
            Intent sentIntent = new Intent(action).setPackage(context.getPackageName()).putExtra("part", index);
            sentIntents.add(PendingIntent.getBroadcast(context, index, sentIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }

        Handler timeoutHandler = new Handler(Looper.getMainLooper());
        Runnable timeout = () -> {
            if (finished.compareAndSet(false, true)) {
                try { context.unregisterReceiver(receiver); } catch (Exception ignored) { }
                call.reject("SMS sending could not be confirmed. Check your cellular service and use Open SMS again if needed.");
            }
        };
        timeoutHandler.postDelayed(timeout, SMS_SEND_TIMEOUT_MS);
        try {
            manager.sendMultipartTextMessage(number, null, parts, sentIntents, null);
        } catch (Exception error) {
            timeoutHandler.removeCallbacks(timeout);
            if (finished.compareAndSet(false, true)) {
                try { context.unregisterReceiver(receiver); } catch (Exception ignored) { }
                call.reject("Could not submit the SOS text to the phone's SMS service.", error);
            }
        }
    }

    @PluginMethod
    public void getLaunchAction(PluginCall call) {
        Intent intent = getActivity().getIntent();
        Uri data = intent == null ? null : intent.getData();
        boolean validScheme = data != null && "tricycleconductreporting".equals(data.getScheme());
        boolean autoSend = validScheme && "sos-send".equals(data.getHost());
        boolean openSos = validScheme && ("sos".equals(data.getHost()) || autoSend);
        if (openSos) getActivity().setIntent(new Intent(Intent.ACTION_MAIN));
        call.resolve(new JSObject().put("openSos", openSos).put("autoSend", autoSend));
    }
}
