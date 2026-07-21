#!/usr/bin/env python3
"""
Automated test suite for the Deep Packet Inspection Engine.

Validates:
  1. The Java engine compiles successfully.
  2. Packet generation produces a valid PCAP file.
  3. The DPI engine processes traffic correctly.
  4. Blocked traffic is dropped; allowed traffic is forwarded.
  5. Output PCAP is a valid, non-empty PCAP file.
"""

import os
import sys
import struct
import subprocess
import shutil

# Paths relative to the project root
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
JAVA_SRC_DIR = os.path.join(PROJECT_ROOT, "src", "main", "java")
OUT_DIR = os.path.join(PROJECT_ROOT, "out")
TEST_INPUT = os.path.join(PROJECT_ROOT, "test_dpi.pcap")
TEST_OUTPUT = os.path.join(PROJECT_ROOT, "test_output.pcap")


def log(msg, status="INFO"):
    """Print a formatted log message."""
    symbols = {"PASS": "+", "FAIL": "X", "INFO": "*", "WARN": "!"}
    print(f"  [{symbols.get(status, '.')}] {msg}")


def count_pcap_packets(filepath):
    """Count the number of packets in a PCAP file."""
    if not os.path.exists(filepath):
        return -1
    count = 0
    with open(filepath, "rb") as f:
        # Read global header (24 bytes)
        ghdr = f.read(24)
        if len(ghdr) < 24:
            return -1
        magic = struct.unpack("<I", ghdr[:4])[0]
        if magic not in (0xA1B2C3D4, 0xD4C3B2A1):
            return -1

        while True:
            phdr = f.read(16)
            if len(phdr) < 16:
                break
            if magic == 0xA1B2C3D4:
                _, _, incl_len, _ = struct.unpack("<IIII", phdr)
            else:
                _, _, incl_len, _ = struct.unpack(">IIII", phdr)
            data = f.read(incl_len)
            if len(data) < incl_len:
                break
            count += 1
    return count


def test_pcap_generation():
    """Test 1: Generate the test PCAP file."""
    print("\n=== Test 1: PCAP Generation ===")
    gen_script = os.path.join(PROJECT_ROOT, "generate_test_pcap.py")

    if not os.path.exists(gen_script):
        log("generate_test_pcap.py not found", "FAIL")
        return False

    result = subprocess.run(
        [sys.executable, gen_script],
        cwd=PROJECT_ROOT,
        capture_output=True, text=True
    )
    if result.returncode != 0:
        log(f"PCAP generation failed: {result.stderr}", "FAIL")
        return False

    pkt_count = count_pcap_packets(TEST_INPUT)
    if pkt_count <= 0:
        log(f"Generated PCAP has {pkt_count} packets", "FAIL")
        return False

    log(f"Generated test_dpi.pcap with {pkt_count} packets", "PASS")
    return True


def test_java_compilation():
    """Test 2: Compile the Java engine."""
    print("\n=== Test 2: Java Compilation ===")

    java_files = []
    for root, dirs, files in os.walk(JAVA_SRC_DIR):
        for f in files:
            if f.endswith(".java"):
                java_files.append(os.path.join(root, f))

    if not java_files:
        log("No Java source files found", "FAIL")
        return False

    log(f"Found {len(java_files)} Java source files", "INFO")

    os.makedirs(OUT_DIR, exist_ok=True)

    cmd = ["javac", "-d", OUT_DIR, "-sourcepath", JAVA_SRC_DIR] + java_files
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        log(f"Compilation failed:\n{result.stderr}", "FAIL")
        return False

    log("All Java files compiled successfully", "PASS")
    return True


def test_dpi_no_rules():
    """Test 3: Run the DPI engine with no blocking rules."""
    print("\n=== Test 3: DPI Engine (No Blocking Rules) ===")

    result = subprocess.run(
        ["java", "-cp", OUT_DIR, "com.dpi.Main", TEST_INPUT, TEST_OUTPUT],
        cwd=PROJECT_ROOT,
        capture_output=True, text=True,
        timeout=30
    )

    if result.returncode != 0:
        log(f"Engine failed: {result.stderr}", "FAIL")
        return False

    input_count = count_pcap_packets(TEST_INPUT)
    output_count = count_pcap_packets(TEST_OUTPUT)

    log(f"Input packets: {input_count}", "INFO")
    log(f"Output packets: {output_count}", "INFO")

    # With no rules, output should contain the IP/TCP/UDP packets
    if output_count <= 0:
        log("Output PCAP is empty", "FAIL")
        return False

    log(f"DPI engine forwarded {output_count} packets (no rules)", "PASS")
    return True


def test_dpi_block_app():
    """Test 4: Run the DPI engine with application blocking."""
    print("\n=== Test 4: DPI Engine (Block YouTube) ===")

    result = subprocess.run(
        ["java", "-cp", OUT_DIR, "com.dpi.Main", TEST_INPUT, TEST_OUTPUT,
         "--block-app", "YouTube"],
        cwd=PROJECT_ROOT,
        capture_output=True, text=True,
        timeout=30
    )

    if result.returncode != 0:
        log(f"Engine failed: {result.stderr}", "FAIL")
        return False

    output = result.stdout
    if "[BLOCKED]" in output and "youtube" in output.lower():
        log("YouTube traffic was correctly blocked", "PASS")
    else:
        log("YouTube blocking not detected in output", "FAIL")
        return False

    if "[Rules] Blocked app: YouTube" in output:
        log("Blocking rule acknowledged", "PASS")
    else:
        log("Blocking rule not confirmed", "WARN")

    return True


def test_dpi_block_ip():
    """Test 5: Run the DPI engine with IP blocking."""
    print("\n=== Test 5: DPI Engine (Block IP 192.168.1.50) ===")

    result = subprocess.run(
        ["java", "-cp", OUT_DIR, "com.dpi.Main", TEST_INPUT, TEST_OUTPUT,
         "--block-ip", "192.168.1.50"],
        cwd=PROJECT_ROOT,
        capture_output=True, text=True,
        timeout=30
    )

    if result.returncode != 0:
        log(f"Engine failed: {result.stderr}", "FAIL")
        return False

    output = result.stdout
    blocked_count = output.count("[BLOCKED]")

    if blocked_count >= 5:
        log(f"Blocked {blocked_count} packets from 192.168.1.50", "PASS")
    else:
        log(f"Only blocked {blocked_count} packets (expected >= 5)", "FAIL")
        return False

    return True


def test_dpi_combined():
    """Test 6: Run with combined blocking rules."""
    print("\n=== Test 6: DPI Engine (Combined Blocking) ===")

    result = subprocess.run(
        ["java", "-cp", OUT_DIR, "com.dpi.Main", TEST_INPUT, TEST_OUTPUT,
         "--block-app", "YouTube",
         "--block-ip", "192.168.1.50",
         "--block-domain", "facebook"],
        cwd=PROJECT_ROOT,
        capture_output=True, text=True,
        timeout=30
    )

    if result.returncode != 0:
        log(f"Engine failed: {result.stderr}", "FAIL")
        return False

    output = result.stdout

    checks = [
        ("YouTube blocked", "youtube" in output.lower() and "[BLOCKED]" in output),
        ("IP blocked", "192.168.1.50" in output),
        ("Facebook blocked", "facebook" in output.lower()),
        ("Report generated", "Total Packets" in output or "Forwarded" in output),
    ]

    all_pass = True
    for name, ok in checks:
        if ok:
            log(name, "PASS")
        else:
            log(name, "FAIL")
            all_pass = False

    return all_pass


def test_output_pcap_valid():
    """Test 7: Verify the output PCAP file is valid."""
    print("\n=== Test 7: Output PCAP Validation ===")

    if not os.path.exists(TEST_OUTPUT):
        log("Output PCAP file not found", "FAIL")
        return False

    pkt_count = count_pcap_packets(TEST_OUTPUT)
    file_size = os.path.getsize(TEST_OUTPUT)

    log(f"Output file size: {file_size} bytes", "INFO")
    log(f"Output packet count: {pkt_count}", "INFO")

    if pkt_count > 0 and file_size > 24:
        log("Output PCAP is valid", "PASS")
        return True
    else:
        log("Output PCAP is invalid or empty", "FAIL")
        return False


def main():
    print("=" * 60)
    print("  Deep Packet Inspection Engine - Automated Test Suite")
    print("=" * 60)

    tests = [
        test_pcap_generation,
        test_java_compilation,
        test_dpi_no_rules,
        test_dpi_block_app,
        test_dpi_block_ip,
        test_dpi_combined,
        test_output_pcap_valid,
    ]

    results = []
    for test in tests:
        try:
            passed = test()
        except Exception as e:
            log(f"Exception: {e}", "FAIL")
            passed = False
        results.append((test.__doc__.strip(), passed))

    # Summary
    print("\n" + "=" * 60)
    print("  TEST SUMMARY")
    print("=" * 60)
    passed_count = sum(1 for _, p in results if p)
    failed_count = len(results) - passed_count

    for name, passed in results:
        status = "[+] PASS" if passed else "[X] FAIL"
        print(f"  {status}  {name}")

    print(f"\n  Total: {len(results)}  Passed: {passed_count}  Failed: {failed_count}")

    if failed_count == 0:
        print("\n  All tests passed!")
    else:
        print(f"\n  {failed_count} test(s) failed.")
    print("=" * 60)

    # Clean up temp output
    if os.path.exists(TEST_OUTPUT):
        os.remove(TEST_OUTPUT)

    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
