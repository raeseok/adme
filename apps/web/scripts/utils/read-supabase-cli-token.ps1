Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class SupabaseCredRead {
  [DllImport("Advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public IntPtr TargetName; public IntPtr Comment;
    public long LastWritten; public int CredentialBlobSize; public IntPtr CredentialBlob;
    public int Persist; public int AttributeCount; public IntPtr Attributes; public IntPtr TargetAlias;
    public IntPtr UserName;
  }
  public static string Read(string target) {
    IntPtr credPtr;
    if (!CredRead(target, 1, 0, out credPtr)) return null;
    var cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
    byte[] bytes = new byte[cred.CredentialBlobSize];
    Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
    return Encoding.UTF8.GetString(bytes);
  }
}
"@
$token = [SupabaseCredRead]::Read("Supabase CLI:supabase")
if (-not $token) { exit 1 }
Write-Output $token
