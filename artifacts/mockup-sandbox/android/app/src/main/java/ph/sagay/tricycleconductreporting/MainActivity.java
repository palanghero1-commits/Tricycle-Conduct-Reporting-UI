package ph.sagay.tricycleconductreporting;

import com.getcapacitor.BridgeActivity;
import android.content.Intent;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        registerPlugin(SosDevicePlugin.class);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
