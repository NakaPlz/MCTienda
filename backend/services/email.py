import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import List, Dict, Any

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("MAIL_PORT", "587"))
        self.sender_email = os.getenv("MAIL_USERNAME", "")
        self.sender_password = os.getenv("MAIL_PASSWORD", "")
        self.from_name = os.getenv("MAIL_FROM_NAME", "Muy Criollo")
        self.admin_email = os.getenv("ADMIN_EMAIL", "muycriolloarg@gmail.com")

    def _load_template(self, template_name: str) -> str:
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            template_path = os.path.join(base_dir, "templates", "emails", template_name)
            with open(template_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Error loading template {template_name}: {e}")
            return ""

    def send_email(self, to_email: str, subject: str, html_content: str):
        if not self.sender_email or not self.sender_password:
            print("WARNING: SMTP credentials not set. Email not sent.")
            return

        msg = MIMEMultipart('alternative')
        msg['From'] = f"{self.from_name} <{self.sender_email}>" if self.from_name else self.sender_email
        msg['To'] = to_email
        msg['Subject'] = subject

        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))

        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            text = msg.as_string()
            server.sendmail(self.sender_email, to_email, text)
            server.quit()
            print(f"📧 Email enviado a {to_email}")
        except Exception as e:
            print(f"❌ Error enviando email a {to_email}: {e}")

    def send_order_confirmation_client(self, order: Any):
        """
        Envía confirmación de compra al CLIENTE (HTML Pro).
        """
        template = self._load_template("confirmation_client.html")
        if not template:
            return

        # Prepare items HTML rows
        items_rows = ""
        for item in order.items:
            # Determine Product Name safely (ORM vs Mock)
            p_name = f"Producto {item.product_id}"
            if hasattr(item, "product") and item.product:
                p_name = item.product.name
            elif hasattr(item, "name"):
                p_name = item.name

            items_rows += f"""
            <tr>
                <td>{p_name} <br><span style="font-size:10px; color:#999">x{item.quantity}</span></td>
                <td style="text-align: right;">${item.unit_price:,.0f}</td>
            </tr>
            """

        # Replace placeholders
        html_content = template.replace("{{customer_name}}", f"{order.customer.full_name}") \
                               .replace("{{order_id}}", str(order.id)) \
                               .replace("{{date}}", order.created_at.strftime("%d/%m/%Y")) \
                               .replace("{{items_rows}}", items_rows) \
                               .replace("{{total}}", f"{order.total_amount:,.0f}")

        # Send to Client
        self.send_email(order.customer.email, f"🎉 Confirmación de Compra #{order.id}", html_content)


    def send_order_notification_admin(self, order_id: int, total: float, customer_name: str, items: List[any]):
        """
        Envía notificación simple de venta al ADMINISTRADOR (Texto plano/Simple).
        """
        subject = f"💰 Nueva Venta #{order_id} - ${total:,.0f}"
        
        # Helper to get item name
        def get_item_name(item):
            if hasattr(item, "product") and item.product:
                return f"{item.product.name} ({item.product_id})"
            if hasattr(item, "name"):
                return item.name
            return item.product_id

        items_str = "\n".join([f"- {item.quantity}x {get_item_name(item)} - ({item.product_id}) - (${item.unit_price})" for item in items])
        body = f"""
        ¡Nueva venta registrada!
        Orden: #{order_id} - Cliente: {customer_name} - Total: ${total:,.2f}
        Items:
        {items_str}
        Revisar en el sistema.
        """
        # Admin gets simpler email for now, or reuse html if preferred. Keeping simple for speed.
        self.send_email(self.admin_email, subject, body.replace("\n", "<br>")) # Simple quick html wrap

    def send_status_update(self, order_id: int, new_status: str, customer_email: str, customer_name: str):
        """
        Envía notificación de CAMBIO DE ESTADO al cliente.
        """
        template = self._load_template("status_update.html")
        if not template:
            return

        status_messages = {
            "paid": "Hemos recibido tu pago correctamente. Estamos preparando tu pedido.",
            "shipped": "¡Tu pedido ha sido enviado! Pronto llegará a tu domicilio.",
            "ready_for_pickup": "Tu pedido está listo para ser retirado en nuestro local.",
            "completed": "Tu pedido ha sido completado. ¡Gracias por elegirnos!",
            "cancelled": "Tu pedido ha sido cancelado. Si tienes dudas, contáctanos."
        }
        
        message = status_messages.get(new_status, f"El estado de tu pedido ha cambiado a: {new_status}")
        
        # Translation map for the badge
        status_trans = {
            "paid": "Pago Aprobado",
            "shipped": "Enviado",
            "ready_for_pickup": "Listo para Retirar",
            "completed": "Completado",
            "cancelled": "Cancelado",
            "pending": "Pendiente"
        }
        status_text = status_trans.get(new_status, new_status.upper())

        html_content = template.replace("{{customer_name}}", customer_name) \
                               .replace("{{order_id}}", str(order_id)) \
                               .replace("{{status_text}}", status_text) \
                               .replace("{{message}}", message)

        self.send_email(customer_email, f"Actualización de Pedido #{order_id}", html_content)
