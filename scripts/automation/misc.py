from datetime import datetime

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005

def fix_files_metadata(s3_aws_client, BUCKET_NAME):
    paginator = s3_aws_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix="")
    updated_count = 0
    skipped_count = 0
    for page in pages:
        if "Contents" not in page:
            continue
        for obj in page["Contents"]:
            key = obj["Key"]
            if key.endswith(".json"):
                head = s3_aws_client.head_object(Bucket=BUCKET_NAME, Key=key)
                current_content_type = head.get("ContentType")
                current_content_disp = head.get("ContentDisposition")
                needs_update = (
                    current_content_type != "application/json"
                    or current_content_disp != "inline"
                )
                if needs_update:
                    print(
                        f"Updating metadata for: {key} "
                        f"(Current: Type='{current_content_type}', Disposition='{current_content_disp}')"
                    )
                    s3_aws_client.copy_object(
                        Bucket=BUCKET_NAME,
                        Key=key,
                        CopySource={"Bucket": BUCKET_NAME, "Key": key},
                        ContentType="application/json",
                        ContentDisposition="inline",
                        MetadataDirective="REPLACE",
                    )
                    updated_count += 1
                else:
                    print(f"Skipping {key} (Metadata already correct)")
                    skipped_count += 1

    print(f"\nFinished! Updated: {updated_count}, Skipped: {skipped_count}")