
class Frame:
    """
    Parses and creates a WebSocket frame.
    """
    def __init__(self):
        self._payload_len = 0
        self._payload_start = 2
        self._mask_start = 2
        self._mask_data = []

        self.fin = False
        self.continues = False
        self.utf8 = False
        self.binary = False
        self.terminate = False
        self.ping = False
        self.pong = False
        self.mask = False

    def create(self, text):
        """
        Creates a from the given text.
        """
        length = len(text)

        if length <= 125:
            ret = bytearray([129, length])
        elif length > 65536:  # 64 bit length
            ret = bytearray([129,
                             127,
                             (length >> 56) & 0xff,
                             (length >> 48) & 0xff,
                             (length >> 40) & 0xff,
                             (length >> 32) & 0xff,
                             (length >> 24) & 0xff,
                             (length >> 16) & 0xff,
                             (length >> 8) & 0xff,
                             length & 0xff])
        else:  # 16bit length
            ret = bytearray([129, 126, (length >> 8) & 0xff, length & 0xff])

        for byte in text.encode("utf-8"):
            ret.append(byte)

        return ret

    def parse(self, data):
        """
        Parses a frame.
        """
        self._parse_first_byte(data[0])
        self._parse_second_byte(data[1])

        if self._payload_len == 126:  # 16 bit int length
            self._payload_len = (data[2] << 8) + data[3]
            self._mask_start += 2
            self._payload_start += 2
        elif self._payload_len == 127:  # 64 bit int length
            self._payload_len = (data[2] << 56) + \
                                (data[3] << 48) + \
                                (data[4] << 40) + \
                                (data[5] << 32) + \
                                (data[6] << 24) + \
                                (data[7] << 16) + \
                                (data[8] << 8) + data[9]
            self._mask_start += 8
            self._payload_start += 8

        if self.mask:
            self._mask_data = [
                data[self._mask_start],
                data[self._mask_start + 1],
                data[self._mask_start + 2],
                data[self._mask_start + 3]
            ]

    def close(self):
        """
        Creates a closing frame.

        """
        return bytearray([136, 0])

    def get_payload(self, data):
        """
        Gets the payload from the given raw data, parse has to be called first!
        """
        if self.mask:
            res = bytearray(self._payload_len)
            i = 0
            for char in data[self._payload_start:]:
                res.append(char ^ self._mask_data[i % 4])
                i += 1

            return res

        return data[self._payload_start:]

    def get_payload_offset(self):
        """
        Returns the payload offset length.

        """
        return self._payload_len - self._payload_start

    def _parse_first_byte(self, byte):
        """
        Parses the first byte.
        """
        self.fin = byte >= 128
        opcode = byte
        if self.fin:
            opcode -= 128

        self.continues = opcode == 0
        self.utf8 = opcode == 1
        self.binary = opcode == 2
        self.terminate = opcode == 8
        self.ping = opcode == 9
        self.pong = opcode == 10

    def _parse_second_byte(self, byte):
        """
        Parses the second byte.
        """
        self.mask = byte >= 128
        self._payload_len = byte

        if self.mask:
            self._payload_start += 4
            self._payload_len -= 128

    def __str__(self):
        lengths_frm = " maskStart: {}\n payloadStart: {}\n payloadLen: {}\n"
        lengths = lengths_frm.format(self._mask_start, self._payload_start, self._payload_len)

        flags_frm = " fin: {}\n continues: {}\n utf8: {}\n binary: {}\n terminate: {}\n ping: {}\n pong: {}\n mask: {}\n"
        flags = flags_frm.format(self.fin, self.continues, self.utf8, self.binary, self.terminate, self.ping, self.pong, self.mask)

        return "Frame:\n" + lengths + flags